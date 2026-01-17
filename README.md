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

### 2. **Scoring Templates**
- High School Dual Meet (5 places: 6-4-3-2-1 for individuals, 8-4-2 for relays, 5-3-1 for diving)
- Competition/Championship Mode (Top 16 scoring)
- Save custom templates to localStorage

### 3. **SEO Optimization**
- **Title tag** with primary keywords
- **Meta description** with key phrases
- **Keywords meta tag** including variations: swimmeet, swimming scoresheet, swim meet score sheet, print swim meet, printable scoring sheet, diving score sheet, dual meet scoresheet, high school swim meet scoring sheet, high school combined meet, varsity swimming, JV swim meet
- **Open Graph tags** for Facebook sharing
- **Twitter Card tags** for Twitter sharing
- **JSON-LD structured data** (WebApplication and SoftwareApplication schemas) with featureList, keywords, alternateNames
- **Canonical URL**
- **Visible SEO description** on page with keywords
- Semantic HTML structure

### 4. **Google Analytics 4 Integration**
- Measurement ID: `G-0G72MC7J4M`
- **Custom event tracking** via `trackEvent()` function
- **Offline analytics queue** - stores events in localStorage when offline, sends when back online
- Events tracked:
  - `add_team` (with team_count)
  - `add_event` (with event_type, event_count)
  - `record_result` (with place)
  - `load_template` (with template_name)
  - `open_settings`
  - `open_help`
  - `change_scoring_mode` (with mode)
  - `pwa_install_prompt`
  - `pwa_install_outcome` (with outcome)
  - `click_donate`
  - `share_scores` (with method, scoring_mode)
  - `print_qr_code`

### 5. **PWA (Progressive Web App)**
- **manifest.json** for app installation
- **Service Worker (sw.js)** with:
  - Offline caching of app files
  - CDN resource caching (React, Babel, Tailwind)
  - Cache versioning (`swimmeetscore-v2`)
  - Stale-while-revalidate strategy
- **Install prompt** for Android Chrome users (in Help modal)
- **iOS install instructions** (manual Add to Home Screen)
- App icons/favicons in multiple sizes

### 6. **Offline Support**
- Service worker caches all assets
- localStorage persists all user data
- **Offline indicator banner** with periodic connectivity check (every 30 seconds on mobile)
- Analytics queue for offline events

### 7. **Share Functionality**
- **Share button** on Scoreboard
- Uses native Web Share API on mobile
- Falls back to clipboard copy on desktop
- Generates formatted text with:
  - Medal emojis (🥇🥈🥉) for top 3
  - Team rankings and scores
  - Marketing tagline: "📊 Scored with SwimMeetScore"
  - Link to swimmeetscore.com

### 8. **Print QR Code Feature**
- Located in Help & Info modal under "For Meet Organizers"
- Opens print-ready window (8.5x11" US Letter)
- QR code links to swimmeetscore.com
- Includes header, tagline, and branding
- Uses api.qrserver.com for QR generation

### 9. **UI/UX Features**
- **Dark mode** toggle (saved to localStorage)
- **Loading screen** with animated spinner and wave dots
- **Responsive design** for mobile/tablet/desktop
- **Touch-friendly** buttons (44px minimum tap targets)
- **Tie indicator** with yellow highlight and hint text
- Help & Info modal with:
  - About section
  - QR Code printer (for meet organizers)
  - Install instructions
  - How to use guide
  - Detailed tie handling explanation with examples
  - Tips and scoring modes

### 10. **Visual Design ("Pool Theme")**
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

### 11. **Performance Optimizations**
- **Preconnect** to CDNs (fonts.googleapis.com, cdnjs.cloudflare.com)
- **DNS prefetch** for external resources
- **Loading screen** shows immediately while scripts load
- **Debounced localStorage writes** (500ms)
- Service worker caches CDN resources for faster repeat visits

### 12. **Data Persistence**
- All data saved to localStorage:
  - Teams and scores
  - Events and results
  - Custom templates
  - Dark mode preference
  - Scoring mode preference

### 13. **Footer Elements**
- Contact emails (info@, support@swimmeetscore.com)
- Buy Me a Coffee donation button with tracking
- Copyright notice
- Terms of Use disclaimer
- Privacy statement (local storage only, no server)

### 14. **Verification & Deployment**
- Google Search Console verification meta tag
- Cloudflare Pages deployment with:
  - Production branch: `main` → swimmeetscore.com
  - Preview branch: `preview` → preview.swimmeetscore.pages.dev

---

## Files Required

| File | Purpose |
|------|---------|
| `index.html` | Main application (single-file React app) |
| `sw.js` | Service worker for offline support |
| `manifest.json` | PWA manifest |
| `favicon.ico` | Browser tab icon |
| `favicon-16x16.png` | Small favicon |
| `favicon-32x32.png` | Medium favicon |
| `favicon-192x192.png` | Android icon |
| `favicon-512x512.png` | Large Android icon |
| `apple-touch-icon.png` | iOS home screen icon |
| `og-image.png` | Social media sharing image (1200x630) |

---

## Key Libraries (CDN)
- React 18.2.0 (production build)
- ReactDOM 18.2.0
- Babel Standalone 7.23.5 (for JSX compilation)
- Tailwind CSS (CDN with custom config)
- Google Fonts (Outfit)

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
