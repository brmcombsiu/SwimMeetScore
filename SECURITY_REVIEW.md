# Technical Security Review: SwimMeetScore

**Review Date:** 2026-02-08
**Reviewer:** Principal Software Engineer / Security Auditor
**Codebase Version:** 1.3.7
**Severity Scale:** Critical / High / Medium / Low

---

## Executive Summary

SwimMeetScore is a well-structured, client-side-only Progressive Web App for tracking swim meet scores. The application stores all data in localStorage, uses React 18 from CDN, and deploys on Cloudflare Pages. The codebase demonstrates good defensive coding practices overall, but this review identifies several bugs, security gaps, performance concerns, and architectural issues that should be addressed before considering this production-grade at scale.

**Finding Totals:** 3 High, 11 Medium, 8 Low

---

## 1. Bug Detection

### BUG-01: `recalculateAllScores` Causes Infinite Re-render Loop on `scoringMode` Change [Medium]

**File:** `app.jsx:2355-2358`

```jsx
useEffect(() => {
  recalculateAllScores(teams, events);
}, [scoringMode]);
```

`recalculateAllScores` calls `setTeams(...)`, which changes the `teams` state. The effect depends only on `scoringMode`, but `recalculateAllScores` closes over the current `teams` and `events` values. Because `setTeams` is called inside it, every call triggers a re-render. While React batches these, the `teams` dependency in the `useCallback` for `recalculateAllScores` means the function identity changes after every call, and the effect only fires on `scoringMode` changes so it doesn't loop infinitely -- but it performs an unnecessary full recalculation. The real bug is that `scoringMode` is a **display filter**, not a scoring parameter. Changing between "Combined / Girls / Boys" shouldn't require recalculating scores at all -- it should only change which scores are displayed (which `sortedTeams` already handles).

**Impact:** Unnecessary full recalculation on every mode switch.

**Fix:** Remove this `useEffect` entirely. The `sortedTeams` useMemo already handles display filtering.

---

### BUG-02: `saveSnapshot` Captures Stale State Due to Closure [High]

**File:** `app.jsx:1751-1767`

```jsx
const saveSnapshot = useCallback((label) => {
  undoStackRef.current.push({
    label: label || 'action',
    teams: JSON.parse(JSON.stringify(teams)),
    events: JSON.parse(JSON.stringify(events))
  });
  // ...
}, [teams, events]);
```

When `saveSnapshot` is called immediately before a state update (e.g., in `updateEventResult` at line 2159), it captures the **current** `teams` and `events` state. However, because `recalculateAllScores` also calls `setTeams`, the snapshot may contain teams with stale scores from before the recalculation. If the user undoes, they'll get slightly incorrect score totals.

Additionally, `saveSnapshot` is a dependency of functions like `updateEventResult`, `removeTeam`, etc. Every time `teams` or `events` changes, `saveSnapshot` gets a new identity, causing all dependent `useCallback` functions to also get new identities. This creates a cascade of unnecessary re-renders.

**Impact:** Undo may restore incorrect score states. Performance impact from callback identity churn.

**Fix:** Use a ref to always read current state:

```jsx
const teamsRef = useRef(teams);
const eventsRef = useRef(events);
useEffect(() => { teamsRef.current = teams; }, [teams]);
useEffect(() => { eventsRef.current = events; }, [events]);

const saveSnapshot = useCallback((label) => {
  undoStackRef.current.push({
    label: label || 'action',
    teams: JSON.parse(JSON.stringify(teamsRef.current)),
    events: JSON.parse(JSON.stringify(eventsRef.current))
  });
  // ...
}, []); // stable identity
```

---

### BUG-03: Debounced Save Can Lose Data on Rapid Navigation [Medium]

**File:** `app.jsx:1527-1543`

The debounced save functions have a 500ms delay. If a user makes a change and immediately closes the tab/browser, the debounced write may not fire, losing the last change.

**Impact:** Data loss on rapid tab close.

**Fix:** Add a `beforeunload` handler that flushes pending saves:

```jsx
useEffect(() => {
  const handleBeforeUnload = () => {
    // Immediately save current state
    utils.saveToStorage('teams', teams);
    utils.saveToStorage('events', events);
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [teams, events]);
```

---

### BUG-04: `generateId` Can Produce Collisions [Low]

**File:** `app.jsx:46-48`

```jsx
generateId: () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
```

`Date.now()` has millisecond precision. If two IDs are generated in the same millisecond (e.g., loading a template that creates many teams and events), the `Date.now()` portion is identical, relying solely on `Math.random()` for uniqueness. While collision probability is very low, it's not zero.

**Impact:** Potential duplicate IDs in batch operations.

**Fix:** Use `crypto.randomUUID()` (supported in all modern browsers) or add a counter:

```jsx
generateId: () => crypto.randomUUID ? crypto.randomUUID() :
  Date.now().toString(36) + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)
```

---

### BUG-05: Cross-Tab Sync Triggers Infinite Save Loop [Medium]

**File:** `app.jsx:1618-1635`

The `storage` event handler updates state (e.g., `setTeams(value)`), which triggers the `useEffect` that debounce-saves back to localStorage. That write fires a `storage` event in other tabs, creating an echo. While `storage` events only fire in **other** tabs (not the originating one), if the user has 3+ tabs open, Tab A's write triggers Tab B's handler, which writes and triggers Tab C, which writes and triggers Tab A... The debounce helps, but doesn't prevent the cascade.

**Impact:** Unnecessary localStorage churn across multiple tabs.

**Fix:** Add a flag to skip saving when the update came from a storage event:

```jsx
const isExternalUpdateRef = useRef(false);

// In storage handler:
isExternalUpdateRef.current = true;
setTeams(value);
requestAnimationFrame(() => { isExternalUpdateRef.current = false; });

// In save effect:
if (isExternalUpdateRef.current) return;
```

---

### BUG-06: `loadMeetFromFile` Skips Validation — Accepts Arbitrary JSON [High]

**File:** `app.jsx:3083-3127`

```jsx
const meetData = JSON.parse(ev.target.result);
if (!meetData.teams || !meetData.events) {
  setError('Invalid meet file.');
  return;
}
setTeams(meetData.teams);
setEvents(meetData.events);
```

The only validation is checking if `teams` and `events` properties exist. The actual structure of teams and events is never validated. A malformed file could inject objects with arbitrary properties, cause `undefined` errors in scoring calculations, or inject React elements via `team.name` containing JSX (though React's default escaping mitigates XSS).

**Impact:** Application crash from malformed data. Potential prototype pollution if `meetData` contains `__proto__` keys.

**Fix:** Validate the structure:

```jsx
const isValidTeam = (t) => t && typeof t.id !== 'undefined' && typeof t.name === 'string';
const isValidEvent = (e) => e && typeof e.id !== 'undefined' && typeof e.name === 'string' && Array.isArray(e.results);

if (!meetData.teams.every(isValidTeam) || !meetData.events.every(isValidEvent)) {
  setError('File contains invalid data structure.');
  return;
}
```

---

### BUG-07: `useEffect` Dependency on `teams.map(t => t.id).join(',')` is Fragile [Low]

**File:** `app.jsx:932`

```jsx
useEffect(() => {
  // ...
}, [teams.map(t => t.id).join(',')]);
```

This creates a string dependency. If a team ID contains a comma, the join produces an ambiguous result. More importantly, this pattern doesn't detect changes to team properties other than `id` (like `name`), and ESLint's exhaustive-deps rule can't validate it.

**Impact:** May fail to sync state when team order changes without ID changes.

---

### BUG-08: Loose Equality Check for Team ID Validation [Low]

**File:** `app.jsx:2158`

```jsx
if (teamId && !teams.some(t => t && t.id == teamId)) return;
```

Uses `==` (loose equality) instead of `===`. Since team IDs can be strings or numbers (generated as strings by `generateId`, but default teams use numeric strings like `'1'`, `'2'`), this works accidentally but is a correctness hazard.

**Impact:** Could cause subtle matching bugs if ID types change.

**Fix:** Use `String(t.id) === String(teamId)` consistently.

---

## 2. Logic & Architecture Review

### ARCH-01: Duplicated Scoring Logic Between `app.jsx` and `lib/scoring.js` [High]

**Files:** `app.jsx:1648-1748` and `lib/scoring.js:69-177`

The `recalculateAllScores` function in `app.jsx` reimplements the exact same scoring algorithm that exists in `lib/scoring.js`. This means:
- Bug fixes must be applied in two places
- The two implementations can silently diverge
- The `lib/scoring.js` module (which has unit tests) is not actually used in production

**Impact:** Maintenance burden, risk of scoring inconsistency.

**Fix:** Import and use `ScoringLib.calculateScores()` in the main app instead of the inline implementation. Since `lib/scoring.js` is not loaded in `index.html`, either add a `<script>` tag or inline the import.

---

### ARCH-02: Monolithic 5000+ Line Single-File Architecture [Medium]

**File:** `app.jsx` (268KB, ~5018 lines)

The entire application — 20+ components, all state management, all business logic, all icon components, all modals — lives in a single file. This makes it difficult to:
- Navigate and understand the codebase
- Test individual components
- Enable code splitting or lazy loading
- Allow multiple developers to work in parallel

**Impact:** Developer productivity, testability, and future maintainability.

**Fix:** Split into modules: `components/`, `hooks/`, `utils/`, `icons/`. The existing Babel build step can be extended to handle imports.

---

### ARCH-03: All State Managed in a Single Root Component [Medium]

**File:** `app.jsx:1209-1500`

The `SwimMeetScore` component manages ~35 separate `useState` hooks. This creates:
- A massive re-render surface (any state change re-renders the entire component tree)
- Tight coupling between unrelated features
- Difficulty reasoning about state transitions

**Impact:** Performance degradation with many teams/events, difficulty in debugging.

**Fix:** Extract related state into custom hooks (e.g., `useScoring`, `useTemplates`, `useMeetHistory`) or use `useReducer` for complex state transitions.

---

### ARCH-04: `confirm()` and `alert()` Block the UI Thread [Low]

**Files:** `app.jsx:3100, 3164` and `app.jsx:2769`

Native `confirm()` and `alert()` are used in several places. These block the JavaScript thread and provide a poor user experience on mobile (non-customizable dialogs).

The app already has a custom `showConfirmDialog` pattern for some confirmations but doesn't use it consistently.

**Impact:** Inconsistent UX, thread blocking.

**Fix:** Replace all `confirm()` / `alert()` calls with the existing `showConfirmDialog` pattern.

---

## 3. Security Audit

### SEC-01: XSS via PDF/HTML Export — Team Names Not Escaped [High]

**File:** `app.jsx:2966-3047`

```jsx
html += '<tr><td>' + (index + 1) + '</td><td>' + team.name + '</td><td>' + score + '</td></tr>';
```

Team names are directly interpolated into HTML strings without escaping in `exportToPDF()`. If a team name contains `<script>alert('xss')</script>` or similar, it will be rendered as HTML in the export window.

While the input validation at `app.jsx:55-56` rejects names containing `<...>` patterns, this defense can be bypassed:
- By loading a malicious JSON meet file (`loadMeetFromFile` doesn't validate team names against XSS)
- By manipulating localStorage directly
- By cross-tab sync receiving unsanitized data

**Impact:** Stored XSS in the context of the export popup window.

**Fix:** HTML-escape all dynamic content in export functions:

```jsx
const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

html += '<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(team.name) + '</td><td>' + score + '</td></tr>';
```

Apply the same treatment to `emailResults()`, `printQRCode()`, and anywhere else raw HTML strings are constructed.

---

### SEC-02: QR Code Print Uses `document.write()` on New Window [Medium]

**File:** `app.jsx:2773`

```jsx
printWindow.document.write(htmlContent);
```

While the content is controlled (not user-generated), using `document.write()` is an anti-pattern flagged by security scanners. The CI pipeline checks for `document.write` patterns, but this may slip through since it's `printWindow.document.write`.

**Impact:** Low risk since content is hardcoded, but violates security best practices.

---

### SEC-03: Missing `Content-Security-Policy` Header [Medium]

**File:** `_headers`

The security headers lack a Content-Security-Policy (CSP). Without CSP:
- Inline scripts execute freely
- External scripts from any domain can be loaded
- If XSS is achieved, there's no second line of defense

**Current headers:**
```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Fix:** Add a CSP header:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://www.googletagmanager.com https://www.clarity.ms; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://api.qrserver.com data:; connect-src 'self' https://www.google-analytics.com https://www.clarity.ms
```

---

### SEC-04: Missing `X-Frame-Options` Header [Medium]

**File:** `_headers`

No `X-Frame-Options` or CSP `frame-ancestors` directive. The application could be embedded in an iframe on a malicious site for clickjacking attacks.

**Fix:** Add to `_headers`:
```
X-Frame-Options: DENY
```

---

### SEC-05: Analytics Queue in localStorage — No Size Limit [Low]

**File:** `index.html:111-122`

```javascript
function queueAnalyticsEvent(eventName, eventParams) {
  const queue = getAnalyticsQueue();
  queue.push({ name: eventName, params: eventParams, timestamp: new Date().toISOString() });
  localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue));
}
```

If the app is used offline for extended periods, the analytics queue grows without bound, potentially consuming localStorage quota. When quota is exceeded, other data saves may fail.

**Impact:** localStorage exhaustion in prolonged offline use.

**Fix:** Cap the queue size:

```javascript
if (queue.length > 500) queue.splice(0, queue.length - 500); // Keep last 500
```

---

### SEC-06: `window.open` Returned Handle Used Without Null Check Pattern Inconsistency [Low]

**Files:** `app.jsx:2766, 3041`

`printQRCode` checks for null return from `window.open`, but then proceeds to call `printWindow.document.write()` outside the null check's scope in the original code. `exportToPDF` also opens a window but its error handling is slightly different. Both should use consistent patterns.

---

### SEC-07: Third-Party Script Integrity [Low]

**File:** `index.html:80, 83-88`

React scripts include SRI hashes (good), but Google Analytics (`gtag.js`) and Microsoft Clarity scripts do not have SRI integrity attributes. If either CDN is compromised, arbitrary code runs in the user's browser.

**Impact:** Supply chain attack vector. Mitigated by the fact that these are first-party analytics scripts (Google, Microsoft) with their own security guarantees, but SRI would add defense-in-depth.

**Note:** GA and Clarity scripts change frequently, making SRI impractical for them. This is an accepted industry trade-off.

---

## 4. Performance Optimization

### PERF-01: Full Re-render on Every State Change [Medium]

**File:** `app.jsx` (entire component)

With ~35 `useState` hooks in a single component, **every state change** causes the entire component tree to re-render, including all event cards, all place selectors, and all icons. With 24 events x 16 places x 10 teams = ~3,840 PlaceSelector components potentially rendered, this is significant.

**Impact:** Jank/lag when entering results on mid-range mobile devices.

**Fix:**
1. Wrap `PlaceSelector`, `QuickEntryEventCard`, and `PointInput` with `React.memo()`
2. Move event-specific state closer to the event components
3. Use `useReducer` for scoring state to batch updates

---

### PERF-02: `JSON.parse(JSON.stringify())` for Deep Clone in Hot Path [Medium]

**File:** `app.jsx:1755, 1773, 1793, 3139`

Deep cloning via `JSON.parse(JSON.stringify(...))` is used in undo/redo and meet history operations. For large state (50 teams, 100 events with results), this is expensive.

**Impact:** ~10-50ms per operation on mobile, noticeable on rapid undo/redo.

**Fix:** Use `structuredClone()` (available in all modern browsers) which is ~2x faster, or implement a targeted shallow-clone strategy since the data structure is known.

---

### PERF-03: Inline Arrow Functions Cause Unnecessary Re-renders [Low]

**Files:** Throughout render methods

Patterns like `onClick={() => togglePlace(team.id, place)}` create new function objects on every render, preventing `React.memo` from working effectively on child components.

**Impact:** Minor, but compounds with PERF-01.

**Fix:** Use `useCallback` with stable references for handlers passed to memoized children.

---

### PERF-04: `recalculateAllScores` Called Too Frequently [Medium]

**File:** `app.jsx`

`recalculateAllScores` is called:
1. On every result update (`updateEventResult`)
2. On every bulk update
3. On scoring mode change (unnecessary — see BUG-01)
4. On team removal
5. On template load
6. On point system changes (via `onBlur`)

Each call iterates over all events and all results. For a Championship meet with 24 events and 16 places each, this means ~384 iterations per call.

**Fix:** Memoize the score calculation with `useMemo`:

```jsx
const calculatedScores = useMemo(() => {
  return calculateScores({ teams, events, ...pointSystems });
}, [teams, events, individualPointSystem, relayPointSystem, divingPointSystem, ...]);
```

This eliminates all explicit `recalculateAllScores` calls and ensures scores are computed exactly once per state change.

---

### PERF-05: Service Worker Caches All Fetch Responses Unconditionally [Low]

**File:** `sw.js:159-178`

The `fetchAndCache` helper caches every successful GET response (filtered only by response type). Over time, this can fill the Cache Storage with responses from fonts, images, or other resources that aren't essential for offline use.

**Impact:** Excess storage usage, slightly slower cache lookups.

**Fix:** Only cache known resources or add a max-entries policy.

---

## 5. Maintainability & Code Quality

### MAINT-01: Event Type Detection via String Matching [Medium]

**Files:** `app.jsx` (throughout), `lib/scoring.js`

Event types are detected by string matching:
```jsx
const isDiving = event.name === 'Diving';
const isRelay = event.name.includes('Relay');
```

This pattern appears ~30 times across the codebase. If a user names an event "Relay Practice" or edits "Diving" to "Diving Exhibition", the scoring logic breaks silently.

**Impact:** Fragile classification that can produce incorrect scores.

**Fix:** Add an explicit `type` field to events:

```jsx
{ id: 1, name: '200 Medley Relay', type: 'relay', results: [], gender: 'girls' }
```

---

### MAINT-02: Team ID Type Inconsistency [Medium]

**Files:** Throughout `app.jsx`

Team IDs are generated as strings (`generateId`), but default teams use string-number IDs (`'1'`, `'2'`). Throughout the codebase, comparisons use a mix of `===`, `==`, `String(t.id)`, `includes(String(teamId))`, and `includes(teamId)`. This inconsistency is a recurring source of subtle bugs.

**Impact:** Potential scoring errors when mixing old and new teams.

**Fix:** Normalize all IDs to strings at creation time and use strict equality everywhere.

---

### MAINT-03: Magic Numbers Throughout [Low]

**Files:** Throughout `app.jsx`

- `50` max teams (line 1839)
- `100` max events (line 1963)
- `20` max templates (line 2043)
- `20` max saved meets (line 3155)
- `5000` ms error timeout (line 1220)
- `6000` ms heat reminder timeout (line 1228)
- `500` ms debounce (line 1536)

**Fix:** Extract to named constants at the top of the file.

---

### MAINT-04: No TypeScript — Complex Data Structures Lack Type Safety [Low]

The application manages complex nested data structures (events with results containing teamIds arrays, point systems as number-keyed objects, templates with nested settings). Without TypeScript, there's no compile-time guarantee that these structures are correct.

**Impact:** Runtime errors from structural mismatches are only caught in production.

---

## 6. Scalability & Reliability

### SCALE-01: localStorage Capacity Ceiling [Medium]

**File:** `app.jsx` (all `saveToStorage` calls)

localStorage is limited to ~5-10MB per origin (browser-dependent). The app stores:
- Teams, events with results
- Three point systems (20 entries each)
- Up to 20 saved meets (each with full teams/events data)
- Up to 20 templates
- Analytics queue
- Various settings

With 20 saved meets, each containing 50 teams and 100 events with full results, storage can approach the limit.

**Impact:** `QuotaExceededError` causing data loss once capacity is reached.

**Fix:**
1. Add storage usage monitoring and warnings
2. Compress meet history data
3. Consider IndexedDB for larger datasets
4. Display current storage usage in Settings

---

### SCALE-02: No Error Boundary [Medium]

**File:** `app.jsx`

A single unhandled error in any component crashes the entire application with a blank screen. There is no React Error Boundary to catch rendering errors and display a fallback UI.

**Impact:** Complete application failure from a single rendering bug.

**Fix:** Add an error boundary:

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) {
    trackEvent('react_error', { error: error.message });
  }
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. <button onClick={() => location.reload()}>Reload</button></div>;
    }
    return this.props.children;
  }
}
```

---

### SCALE-03: Service Worker `skipWaiting` Can Cause Version Mismatch [Low]

**File:** `sw.js:66`

`self.skipWaiting()` forces the new service worker to activate immediately. If the HTML page loaded with SW v17 but the new SW v18 caches updated app.js, the running HTML page may have stale JavaScript references, leading to undefined behavior.

**Impact:** Potential runtime errors after SW update if cached assets are incompatible.

**Fix:** Prompt the user to reload when a new service worker activates, rather than auto-activating:

```javascript
// In index.html SW registration:
newWorker.addEventListener('statechange', () => {
  if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
    // Show "New version available - reload" banner
  }
});
```

---

### SCALE-04: No Data Migration Strategy for Future Schema Changes [Low]

**File:** `app.jsx:1354-1393`

The current migration code handles version 3 -> 4. But there's no general migration framework. Each future schema change requires hand-coded migration logic with special attention to edge cases (partially migrated data, interrupted migrations, etc.).

**Fix:** Implement a migration registry:

```jsx
const migrations = {
  3: (data) => { /* v3 -> v4 migration */ },
  4: (data) => { /* v4 -> v5 migration */ },
};
```

---

## Summary of Findings by Severity

| Severity | Count | Key Issues |
|----------|-------|------------|
| **High** | 3 | XSS in exports (SEC-01), duplicated scoring logic (ARCH-01), stale undo snapshots (BUG-02), unvalidated file import (BUG-06) |
| **Medium** | 11 | Missing CSP (SEC-03), missing X-Frame-Options (SEC-04), performance from re-renders (PERF-01/04), cross-tab sync loop (BUG-05), debounced data loss (BUG-03), no error boundary (SCALE-02), monolithic architecture (ARCH-02/03), string-based event detection (MAINT-01), ID type inconsistency (MAINT-02), localStorage ceiling (SCALE-01) |
| **Low** | 8 | ID collisions (BUG-04), analytics queue unbounded (SEC-05), SW version mismatch (SCALE-03), magic numbers (MAINT-03), no TypeScript (MAINT-04), inline arrow functions (PERF-03), confirm/alert usage (ARCH-04), migration strategy (SCALE-04) |

## Recommended Priority Order

1. **SEC-01** (XSS in exports) — Fix immediately
2. **BUG-06** (Unvalidated file import) — Fix immediately
3. **SEC-03/SEC-04** (CSP and X-Frame-Options headers) — Fix in next deploy
4. **BUG-02** (Stale undo snapshots) — Fix in next release
5. **ARCH-01** (Deduplicate scoring logic) — Fix in next release
6. **PERF-01/PERF-04** (Performance) — Plan for next minor version
7. **BUG-03** (Debounced save data loss) — Fix in next release
8. **SCALE-02** (Error boundary) — Fix in next release
9. **ARCH-02/03** (Architecture refactoring) — Plan for major version
10. Remaining issues — Address as part of ongoing maintenance
