/**
 * App Logic Tests
 *
 * Tests that verify actual app behavior by reading the source code.
 * Run with: node tests/app-logic.test.js
 */

const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.jsx'), 'utf8');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    failed++;
    return false;
  }
  console.log(`  PASS: ${message}`);
  passed++;
  return true;
}

// --- Diving events excluded from heat lock ---
console.log('\n--- Diving excluded from heat lock scoring rules ---');

// Heat lock badge should check !isDiving in all display locations
const heatLockBadgeMatches = appSource.match(/heatLockEnabled && !isRelay/g) || [];
const heatLockBadgeWithDiving = appSource.match(/heatLockEnabled && !isRelay && !isDiving/g) || [];
assert(
  heatLockBadgeMatches.length === heatLockBadgeWithDiving.length,
  `All ${heatLockBadgeMatches.length} heatLockEnabled && !isRelay checks should also exclude diving (found ${heatLockBadgeWithDiving.length})`
);

// B Finals reminder should exclude diving
assert(
  appSource.includes('!isDivingEvent && numIndividualPlaces'),
  'B Finals reminder should exclude diving events'
);

// showHeatLabels should exclude diving
assert(
  appSource.includes('!isRelay && !isDiving && numPlaces > 10'),
  'showHeatLabels should exclude diving events'
);

// --- Version consistency ---
console.log('\n--- Version consistency ---');

const appVersionMatch = appSource.match(/APP_VERSION\s*=\s*'([^']+)'/);
const indexSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const schemaVersionMatch = indexSource.match(/"softwareVersion":\s*"([^"]+)"/);
const pkgSource = fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8');
const pkgVersionMatch = pkgSource.match(/"version":\s*"([^"]+)"/);

if (appVersionMatch && schemaVersionMatch && pkgVersionMatch) {
  const appVer = appVersionMatch[1];
  assert(
    appVer === schemaVersionMatch[1],
    `app.jsx version (${appVer}) matches index.html schema version (${schemaVersionMatch[1]})`
  );
  assert(
    appVer === pkgVersionMatch[1],
    `app.jsx version (${appVer}) matches package.json version (${pkgVersionMatch[1]})`
  );
} else {
  assert(false, 'Could not extract version from one or more files');
}

// --- Service worker cache includes all critical files ---
console.log('\n--- Service worker caching ---');

const swSource = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
const criticalFiles = ['./index.html', './app.js', './app.css', './manifest.json'];
for (const file of criticalFiles) {
  assert(swSource.includes(`'${file}'`), `SW caches critical file: ${file}`);
}

// SW uses Promise.allSettled for resilient install
assert(
  swSource.includes('Promise.allSettled'),
  'SW install uses Promise.allSettled for resilient caching'
);

// SW navigation handler always returns a Response (has synthetic fallback)
assert(
  swSource.includes('OFFLINE_FALLBACK') && swSource.includes('new Response(OFFLINE_FALLBACK'),
  'SW navigation handler has synthetic offline fallback'
);

// --- Offline banner is dismissible ---
console.log('\n--- Offline banner ---');

assert(
  appSource.includes('offlineDismissed'),
  'Offline banner has dismiss state'
);
assert(
  appSource.includes('setOfflineDismissed(true)'),
  'Offline banner can be dismissed'
);
assert(
  appSource.includes('setOfflineDismissed(false)'),
  'Offline dismiss resets when coming back online'
);
assert(
  appSource.includes('pointer-events-none') && appSource.includes('pointer-events-auto'),
  'Offline banner allows clicks to pass through to buttons underneath'
);

// --- Built app.js is in sync with app.jsx ---
console.log('\n--- Build output ---');

const appJsSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const jsxVersionMatch = appSource.match(/APP_VERSION\s*=\s*'([^']+)'/);
const jsVersionMatch = appJsSource.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
if (jsxVersionMatch && jsVersionMatch) {
  assert(
    jsxVersionMatch[1] === jsVersionMatch[1],
    `Compiled app.js version (${jsVersionMatch[1]}) matches app.jsx source (${jsxVersionMatch[1]})`
  );
} else {
  assert(false, 'Could not extract APP_VERSION from compiled output');
}

// --- Summary ---
console.log(`\n=== Test Summary: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exitCode = 1;
}
