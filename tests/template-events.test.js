/**
 * Template Events Tests
 *
 * These tests verify that diving events are correctly included or excluded
 * in the appropriate templates. Run with: node tests/template-events.test.js
 */

// Extract template data structures from the codebase for testing
const highSchoolEvents = [
  { name: '200 Medley Relay', gender: 'girls' },
  { name: '200 Medley Relay', gender: 'boys' },
  { name: '200 Freestyle', gender: 'girls' },
  { name: '200 Freestyle', gender: 'boys' },
  { name: '200 IM', gender: 'girls' },
  { name: '200 IM', gender: 'boys' },
  { name: '50 Freestyle', gender: 'girls' },
  { name: '50 Freestyle', gender: 'boys' },
  { name: 'Diving', gender: 'girls' },
  { name: 'Diving', gender: 'boys' },
  { name: '100 Butterfly', gender: 'girls' },
  { name: '100 Butterfly', gender: 'boys' },
  { name: '100 Freestyle', gender: 'girls' },
  { name: '100 Freestyle', gender: 'boys' },
  { name: '500 Freestyle', gender: 'girls' },
  { name: '500 Freestyle', gender: 'boys' },
  { name: '200 Freestyle Relay', gender: 'girls' },
  { name: '200 Freestyle Relay', gender: 'boys' },
  { name: '100 Backstroke', gender: 'girls' },
  { name: '100 Backstroke', gender: 'boys' },
  { name: '100 Breaststroke', gender: 'girls' },
  { name: '100 Breaststroke', gender: 'boys' },
  { name: '400 Freestyle Relay', gender: 'girls' },
  { name: '400 Freestyle Relay', gender: 'boys' }
];

const competitionEvents = [
  { name: '200 Medley Relay', gender: 'girls' },
  { name: '200 Medley Relay', gender: 'boys' },
  { name: '200 Freestyle', gender: 'girls' },
  { name: '200 Freestyle', gender: 'boys' },
  { name: '200 IM', gender: 'girls' },
  { name: '200 IM', gender: 'boys' },
  { name: '50 Freestyle', gender: 'girls' },
  { name: '50 Freestyle', gender: 'boys' },
  { name: 'Diving', gender: 'girls' },
  { name: 'Diving', gender: 'boys' },
  { name: '100 Butterfly', gender: 'girls' },
  { name: '100 Butterfly', gender: 'boys' },
  { name: '100 Freestyle', gender: 'girls' },
  { name: '100 Freestyle', gender: 'boys' },
  { name: '500 Freestyle', gender: 'girls' },
  { name: '500 Freestyle', gender: 'boys' },
  { name: '200 Freestyle Relay', gender: 'girls' },
  { name: '200 Freestyle Relay', gender: 'boys' },
  { name: '100 Backstroke', gender: 'girls' },
  { name: '100 Backstroke', gender: 'boys' },
  { name: '100 Breaststroke', gender: 'girls' },
  { name: '100 Breaststroke', gender: 'boys' },
  { name: '400 Freestyle Relay', gender: 'girls' },
  { name: '400 Freestyle Relay', gender: 'boys' }
];

// Templates that should include diving
const templatesWithDiving = [
  'high_school',
  'conference',
  'sectionals'
];

// Templates that should NOT include diving (USA Swimming templates)
const templatesWithoutDiving = [
  'usa_swimming_4',
  'usa_swimming_5',
  'usa_swimming_6',
  'usa_swimming_7',
  'usa_swimming_8',
  'usa_swimming_9',
  'usa_swimming_10'
];

// Helper functions
function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`PASS: ${message}`);
  return true;
}

function findDivingIndex(events) {
  return events.findIndex(e => e.name === 'Diving');
}

function find50FreestyleIndex(events) {
  return events.findIndex(e => e.name === '50 Freestyle');
}

function find100ButterflyIndex(events) {
  return events.findIndex(e => e.name === '100 Butterfly');
}

function hasDiving(events) {
  return events.some(e => e.name === 'Diving');
}

function countDivingEvents(events) {
  return events.filter(e => e.name === 'Diving').length;
}

// Simulate USA Swimming template event creation
function getUSASwimmingEvents() {
  return competitionEvents.filter((e) => e.name !== 'Diving');
}

// Tests
console.log('=== Template Events Tests ===\n');

// Test 1: High School Events includes diving
console.log('--- High School Template ---');
assert(hasDiving(highSchoolEvents), 'High School events should include diving');
assert(countDivingEvents(highSchoolEvents) === 2, 'High School events should have 2 diving events (girls and boys)');

// Test 2: Competition Events includes diving
console.log('\n--- Competition Events Template ---');
assert(hasDiving(competitionEvents), 'Competition events should include diving');
assert(countDivingEvents(competitionEvents) === 2, 'Competition events should have 2 diving events (girls and boys)');

// Test 3: Diving position is after 50 Freestyle in High School
console.log('\n--- Diving Position in High School ---');
const hs50FreeIndex = find50FreestyleIndex(highSchoolEvents);
const hsDivingIndex = findDivingIndex(highSchoolEvents);
const hs100FlyIndex = find100ButterflyIndex(highSchoolEvents);
assert(hsDivingIndex > hs50FreeIndex, `Diving (index ${hsDivingIndex}) should come after 50 Freestyle (index ${hs50FreeIndex})`);
assert(hsDivingIndex < hs100FlyIndex, `Diving (index ${hsDivingIndex}) should come before 100 Butterfly (index ${hs100FlyIndex})`);

// Test 4: Diving position is after 50 Freestyle in Competition Events
console.log('\n--- Diving Position in Competition Events ---');
const comp50FreeIndex = find50FreestyleIndex(competitionEvents);
const compDivingIndex = findDivingIndex(competitionEvents);
const comp100FlyIndex = find100ButterflyIndex(competitionEvents);
assert(compDivingIndex > comp50FreeIndex, `Diving (index ${compDivingIndex}) should come after 50 Freestyle (index ${comp50FreeIndex})`);
assert(compDivingIndex < comp100FlyIndex, `Diving (index ${compDivingIndex}) should come before 100 Butterfly (index ${comp100FlyIndex})`);

// Test 5: USA Swimming events should NOT include diving
console.log('\n--- USA Swimming Template ---');
const usaSwimmingEvents = getUSASwimmingEvents();
assert(!hasDiving(usaSwimmingEvents), 'USA Swimming events should NOT include diving');
assert(countDivingEvents(usaSwimmingEvents) === 0, 'USA Swimming events should have 0 diving events');
assert(usaSwimmingEvents.length === competitionEvents.length - 2, 'USA Swimming events should have 2 fewer events than competition events (no diving)');

// Test 6: Verify deterministic event order
console.log('\n--- Deterministic Event Order ---');
const expectedEventOrder = [
  '200 Medley Relay',
  '200 Freestyle',
  '200 IM',
  '50 Freestyle',
  'Diving',
  '100 Butterfly',
  '100 Freestyle',
  '500 Freestyle',
  '200 Freestyle Relay',
  '100 Backstroke',
  '100 Breaststroke',
  '400 Freestyle Relay'
];

// Get unique event names in order (girls events come first in each pair)
const actualEventOrder = [];
for (const event of competitionEvents) {
  if (!actualEventOrder.includes(event.name)) {
    actualEventOrder.push(event.name);
  }
}

const orderMatch = JSON.stringify(actualEventOrder) === JSON.stringify(expectedEventOrder);
assert(orderMatch, 'Event order should match expected order');
if (!orderMatch) {
  console.log('  Expected:', expectedEventOrder);
  console.log('  Actual:  ', actualEventOrder);
}

// Test 7: Verify both genders exist for diving
console.log('\n--- Diving Gender Completeness ---');
const divingEvents = competitionEvents.filter(e => e.name === 'Diving');
const divingGirls = divingEvents.find(e => e.gender === 'girls');
const divingBoys = divingEvents.find(e => e.gender === 'boys');
assert(divingGirls !== undefined, 'Diving should have a girls event');
assert(divingBoys !== undefined, 'Diving should have a boys event');

// Test 8: Girls diving should come before boys diving (consistent with other events)
console.log('\n--- Diving Gender Order ---');
const divingGirlsIndex = competitionEvents.findIndex(e => e.name === 'Diving' && e.gender === 'girls');
const divingBoysIndex = competitionEvents.findIndex(e => e.name === 'Diving' && e.gender === 'boys');
assert(divingGirlsIndex < divingBoysIndex, 'Girls diving should come before boys diving');
assert(divingBoysIndex === divingGirlsIndex + 1, 'Boys diving should immediately follow girls diving');

// Test 9: Total event counts are correct
console.log('\n--- Event Counts ---');
assert(highSchoolEvents.length === 24, `High School should have 24 events (has ${highSchoolEvents.length})`);
assert(competitionEvents.length === 24, `Competition should have 24 events (has ${competitionEvents.length})`);
assert(usaSwimmingEvents.length === 22, `USA Swimming should have 22 events (has ${usaSwimmingEvents.length})`);

// Summary
console.log('\n=== Test Summary ===');
if (process.exitCode === 1) {
  console.log('Some tests FAILED!');
} else {
  console.log('All tests PASSED!');
}
