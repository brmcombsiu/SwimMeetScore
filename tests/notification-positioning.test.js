/**
 * Notification Positioning Tests
 *
 * These tests verify that error, success, and offline notifications
 * use fixed positioning to remain visible regardless of scroll position.
 * Run with: node tests/notification-positioning.test.js
 */

const fs = require('fs');
const path = require('path');

// Read the app.jsx file where notification markup lives
const appPath = path.join(__dirname, '..', 'app.jsx');
const htmlContent = fs.readFileSync(appPath, 'utf8');

// Helper function for assertions
function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`PASS: ${message}`);
  return true;
}

console.log('=== Notification Positioning Tests ===\n');

// Test 1: Error notification uses fixed positioning
console.log('--- Error Notification Positioning ---');
const errorMatch = htmlContent.match(/\{error\s*&&\s*\(\s*<div\s+className="([^"]+)"/);
if (errorMatch) {
  const errorClasses = errorMatch[1];
  assert(errorClasses.includes('fixed'), 'Error notification should have "fixed" class');
  assert(errorClasses.includes('top-4'), 'Error notification should have "top-4" class for top positioning');
  assert(errorClasses.includes('z-50'), 'Error notification should have "z-50" class for proper stacking');
  assert(errorClasses.includes('left-4'), 'Error notification should have "left-4" for left margin');
  assert(errorClasses.includes('right-4'), 'Error notification should have "right-4" for right margin');
  assert(errorClasses.includes('flex'), 'Error notification should have "flex" class');
  assert(errorClasses.includes('justify-center'), 'Error notification should have "justify-center" for centering');
} else {
  console.error('FAIL: Could not find error notification in HTML');
  process.exitCode = 1;
}

// Test 2: Success notification uses fixed positioning
console.log('\n--- Success Notification Positioning ---');
const successMatch = htmlContent.match(/\{shareSuccess\s*&&\s*\(\s*<div\s+className="([^"]+)"/);
if (successMatch) {
  const successClasses = successMatch[1];
  assert(successClasses.includes('fixed'), 'Success notification should have "fixed" class');
  assert(successClasses.includes('top-4'), 'Success notification should have "top-4" class for top positioning');
  assert(successClasses.includes('z-50'), 'Success notification should have "z-50" class for proper stacking');
  assert(successClasses.includes('left-4'), 'Success notification should have "left-4" for left margin');
  assert(successClasses.includes('right-4'), 'Success notification should have "right-4" for right margin');
  assert(successClasses.includes('flex'), 'Success notification should have "flex" class');
  assert(successClasses.includes('justify-center'), 'Success notification should have "justify-center" for centering');
} else {
  console.error('FAIL: Could not find success notification in HTML');
  process.exitCode = 1;
}

// Test 3: Offline notification uses fixed positioning
console.log('\n--- Offline Notification Positioning ---');
const offlineMatch = htmlContent.match(/\{isOffline\s*&&\s*\(\s*<div\s+className="([^"]+)"/);
if (offlineMatch) {
  const offlineClasses = offlineMatch[1];
  assert(offlineClasses.includes('fixed'), 'Offline notification should have "fixed" class');
  assert(offlineClasses.includes('top-4'), 'Offline notification should have "top-4" class for top positioning');
  assert(offlineClasses.includes('z-50'), 'Offline notification should have "z-50" class for proper stacking');
  assert(offlineClasses.includes('left-4'), 'Offline notification should have "left-4" for left margin');
  assert(offlineClasses.includes('right-4'), 'Offline notification should have "right-4" for right margin');
  assert(offlineClasses.includes('flex'), 'Offline notification should have "flex" class');
  assert(offlineClasses.includes('justify-center'), 'Offline notification should have "justify-center" for centering');
} else {
  console.error('FAIL: Could not find offline notification in HTML');
  process.exitCode = 1;
}

// Test 4: Notifications are placed outside the scrollable container
console.log('\n--- Notification Container Placement ---');
// Check that notifications come before the max-w-6xl container
const maxWidthContainerIndex = htmlContent.indexOf('<div className="max-w-6xl mx-auto">');
const errorNotificationIndex = htmlContent.indexOf('{error && (');
const successNotificationIndex = htmlContent.indexOf('{shareSuccess && (');
const offlineNotificationIndex = htmlContent.indexOf('{isOffline && (');

// Notifications should appear before the main content container in the DOM
// (they should be outside/before it, not inside it)
assert(
  errorNotificationIndex < maxWidthContainerIndex,
  'Error notification should be placed before the main content container'
);
assert(
  successNotificationIndex < maxWidthContainerIndex,
  'Success notification should be placed before the main content container'
);
assert(
  offlineNotificationIndex < maxWidthContainerIndex,
  'Offline notification should be placed before the main content container'
);

// Test 5: Notifications have animation class for better visibility
console.log('\n--- Notification Animation ---');
const errorHasAnimation = htmlContent.includes('error &&') &&
  htmlContent.substring(htmlContent.indexOf('error &&'), htmlContent.indexOf('error &&') + 300).includes('animate-fade-slide-up');
const successHasAnimation = htmlContent.includes('shareSuccess &&') &&
  htmlContent.substring(htmlContent.indexOf('shareSuccess &&'), htmlContent.indexOf('shareSuccess &&') + 300).includes('animate-fade-slide-up');

assert(errorHasAnimation, 'Error notification should have animation class');
assert(successHasAnimation, 'Success notification should have animation class');

// Test 6: Notifications have shadow for better visibility
console.log('\n--- Notification Shadow ---');
const errorSection = htmlContent.substring(htmlContent.indexOf('{error &&'), htmlContent.indexOf('{error &&') + 500);
const successSection = htmlContent.substring(htmlContent.indexOf('{shareSuccess &&'), htmlContent.indexOf('{shareSuccess &&') + 500);
const offlineSection = htmlContent.substring(htmlContent.indexOf('{isOffline &&'), htmlContent.indexOf('{isOffline &&') + 500);

assert(errorSection.includes('shadow-lg'), 'Error notification should have shadow-lg class');
assert(successSection.includes('shadow-lg'), 'Success notification should have shadow-lg class');
assert(offlineSection.includes('shadow-lg'), 'Offline notification should have shadow-lg class');

// Test 7: Notifications have max width for readability
console.log('\n--- Notification Width Constraints ---');
assert(errorSection.includes('max-w-lg'), 'Error notification should have max-w-lg class');
assert(successSection.includes('max-w-lg'), 'Success notification should have max-w-lg class');
assert(offlineSection.includes('max-w-lg'), 'Offline notification should have max-w-lg class');

// Summary
console.log('\n=== Test Summary ===');
if (process.exitCode === 1) {
  console.log('Some tests FAILED!');
} else {
  console.log('All tests PASSED!');
}
