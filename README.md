# SwimMeetScore
Free swimming scoresheet and swim meet scoring tool. Track team scores, individual events, relays, and diving. High school dual meet scoresheet, championship meets, and more — use instantly, no download required!

https://swimmeetscore.com

https://www.swimmeetscore.com

# SwimMeetScore Development Summary

## Complete Feature List & Implementation Guide

### 1. **Core Functionality**
- Swim meet scoring with customizable point systems
- Support for individual events, relays, and diving
- Team management (add, edit, remove teams)
- Event management (add, remove, reorder events)
- Scoring modes: Combined, Girls Only, Boys Only
- **Tie handling** with point splitting and place skipping (official swimming rules)
- **Undo/Redo** for score changes with full history stack
- **Team Mode** — select team first, then assign places
- **Bulk Entry Modal** — batch-enter results for an event with per-team place selection
- **Auto-fill** for dual meets — automatically assigns remaining places to the other team
- **Haptic feedback** on mobile devices for button interactions

### 2. **Scoring Templates**
- **High School Dual Meet** — 2 teams, 5 places (6-4-3-2-1 individual, 8-4-2 relay, 5-3-1 diving)
- **Conference** — 8 teams, 16 places
- **Sectionals** — 10 teams, 16 places
- **USA Swimming Multi-Lane** — 4, 5, 6, 7, 8, 9, or 10-lane configurations with official point values (relay points doubled)
- **Custom templates** — save up to 20 user-defined templates to localStorage

### 3. **Advanced Scoring Options**
- Heat Lock for meets with 9+ places
- B Finals bracket scoring for large meets
- Team place limits for relays
- A Relay Only mode

### 4. **SEO Optimization**
- **Title tag** with primary keywords
- **Meta description** with key phrases
- **Keywords meta tag** including variations: swimmeet, swimming scoresheet, swim meet score sheet, print swim meet, printable scoring sheet, diving score sheet, dual meet scoresheet, high school swim meet scoring sheet, high school combined meet, varsity swimming, JV swim meet
- **Open Graph tags** for Facebook sharing
- **Twitter Card tags** for Twitter sharing
- **JSON-LD structured data** (WebApplication and SoftwareApplication schemas) with featureList, keywords, alternateNames
- **Canonical URL**
- **Visible SEO description** on page with keywords
- Semantic HTML structure

### 5. **Google Analytics 4 Integration**
- Measurement ID: `G-0G72MC7J4M`
- **Custom event tracking** via `trackEvent()` function
- **Offline analytics queue** — stores events in localStorage when offline, sends when back online
- **Global error monitoring** — tracks uncaught errors via GA4
- Events tracked:
  - `add_team` (with team_count)
  - `add_event` (with event_type, event_count)
  - `record_result` (with place)
  - `load_template` (with template_name)
  - `open_settings`
  - `open_help`
  - `change_scoring_mode` (with mode)
  - `toggle_entry_mode`
  - `bulk_entry_save` (with team_count, places_selected)
  - `undo`, `redo`
  - `pwa_install_prompt`
  - `pwa_install_outcome` (with outcome)
  - `click_donate`
  - `share_scores` (with method, scoring_mode)
  - `print_qr_code`

### 6. **PWA (Progressive Web App)**
- **manifest.json** for app installation
- **Service Worker (sw.js)** with:
  - Offline caching of app files
  - CDN resource caching (React, Tailwind)
  - Cache versioning (`swimmeetscore-v2`)
  - Stale-while-revalidate strategy
- **Install prompt** for Android Chrome users (in Help modal)
- **iOS install instructions** (manual Add to Home Screen)
- App icons/favicons in multiple sizes

### 7. **Offline Support**
- Service worker caches all assets
- localStorage persists all user data
- **Offline indicator banner** with dismiss button and periodic connectivity check (every 30 seconds on mobile)
- Analytics queue for offline events
- **Non-blocking font loading** with font caching fallback

### 8. **Share Functionality**
- **Share button** on Scoreboard
- Uses native Web Share API on mobile
- Falls back to clipboard copy on desktop
- Generates formatted text with:
  - Medal emojis for top 3
  - Team rankings and scores
  - Marketing tagline and link to swimmeetscore.com

### 9. **Print QR Code Feature**
- Located in Help & Info modal under "For Meet Organizers"
- Opens print-ready window (8.5x11" US Letter)
- QR code links to swimmeetscore.com
- Includes header, tagline, and branding
- Uses api.qrserver.com for QR generation

### 10. **UI/UX Features**
- **Dark mode** toggle (saved to localStorage)
- **Loading screen** with animated spinner and wave dots
- **Responsive design** for mobile/tablet/desktop
- **Touch-friendly** buttons (44px minimum tap targets)
- **Tie indicator** with yellow highlight and hint text
- **Undo/Redo buttons** in the Events section header
- Help & Info modal with:
  - About section
  - QR Code printer (for meet organizers)
  - Install instructions
  - How to use guide
  - Detailed tie handling explanation with examples
  - Tips and scoring modes

### 11. **Visual Design ("Pool Theme")**
- **Custom font**: Outfit (Google Fonts)
- **Color palette**:
  - Pool deep: #0c1929
  - Pool mid: #0f2942
  - Pool light: #164e6e
  - Chlorine teal: #00d4aa
  - Lane gold: #fbbf24
- **Animations**:
  - Pool lane lines drifting (loading screen)
  - Wave loader dots
  - Water ripple effect
  - Fade-slide-up entrance animations
  - Gold shimmer for 1st place
- **Lane line patterns** as subtle background decoration
- Light mode with sky/cyan gradients

### 12. **Performance Optimizations**
- **Preconnect** to CDNs (fonts.googleapis.com, cdnjs.cloudflare.com)
- **DNS prefetch** for external resources
- **Loading screen** shows immediately while scripts load
- **Debounced localStorage writes** (500ms)
- Service worker caches CDN resources for faster repeat visits

### 13. **Data Persistence**
- All data saved to localStorage:
  - Teams and scores
  - Events and results
  - Custom templates
  - Dark mode preference
  - Scoring mode preference

### 14. **Footer Elements**
- Contact emails (info@, support@swimmeetscore.com)
- Buy Me a Coffee donation button with tracking
- Copyright notice
- Terms of Use disclaimer
- Privacy statement (local storage only, no server)

### 15. **Verification & Deployment**
- Google Search Console verification meta tag
- Cloudflare Pages deployment with:
  - Production branch: `main` → swimmeetscore.com
  - Preview branch: `preview` → preview.swimmeetscore.pages.dev

---

## Build Process

The app uses a build step to compile JSX and Tailwind CSS:

```bash
npm install        # install devDependencies
npm run build      # compile app.jsx → app.js and input.css → app.css
```

**Scripts** (from package.json):
- `build:js` — Babel transpiles `app.jsx` to `app.js` (React JSX → plain JS)
- `build:css` — Tailwind compiles `input.css` to `app.css` (minified)
- `build` — runs both

---

## Project Files

| File | Purpose |
|------|---------|
| `index.html` | Main HTML shell — loads React from CDN, includes built app.js and app.css |
| `app.jsx` | Application source (React components, all app logic) |
| `app.js` | Built/transpiled output of app.jsx |
| `input.css` | Tailwind CSS source with custom styles |
| `app.css` | Built/minified Tailwind output |
| `tailwind.config.js` | Tailwind configuration with pool theme colors |
| `package.json` | Project metadata and build scripts |
| `sw.js` | Service worker for offline support |
| `manifest.json` | PWA manifest |
| `CLAUDE.md` | Persistent instructions for Claude Code sessions |
| `favicon.ico` | Browser tab icon |
| `favicon-16x16.png` | Small favicon |
| `favicon-32x32.png` | Medium favicon |
| `favicon-192x192.png` | Android icon |
| `favicon-512x512.png` | Large Android icon |
| `apple-touch-icon.png` | iOS home screen icon |
| `og-image.png` | Social media sharing image (1200x630) |

---

## Key Libraries

| Library | Version | Source |
|---------|---------|--------|
| React | 18.2.0 | CDN (production build) |
| ReactDOM | 18.2.0 | CDN |
| Tailwind CSS | 3.4.0 | Build-time (devDependency) |
| Babel CLI | 7.23.5 | Build-time (devDependency) |
| Google Fonts (Outfit) | — | CDN |

---

## Reproduction Checklist for New Projects

1. ☐ Set up SEO meta tags (title, description, keywords, OG, Twitter)
2. ☐ Add JSON-LD structured data
3. ☐ Create Google Analytics 4 property and add tracking code
4. ☐ Implement offline analytics queue
5. ☐ Create PWA manifest.json
6. ☐ Create service worker with caching strategy
7. ☐ Add install prompts (Android + iOS instructions)
8. ☐ Implement offline detection with periodic check for mobile
9. ☐ Add share functionality (Web Share API + clipboard fallback)
10. ☐ Create loading screen for perceived performance
11. ☐ Add preconnect/dns-prefetch for external resources
12. ☐ Implement dark mode with localStorage persistence
13. ☐ Generate favicons in all required sizes
14. ☐ Set up Cloudflare Pages with preview/production branches
15. ☐ Add Google Search Console verification
16. ☐ Create donation/support link with tracking
