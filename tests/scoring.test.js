/**
 * Scoring Logic Unit Tests
 */

const {
  isDivingEvent,
  isRelayEvent,
  calculateTiePoints,
  calculateScores,
  calculateConsumedPlaces,
  validateResults,
  POINT_SYSTEMS
} = require('../lib/scoring');

describe('Event Type Detection', () => {
  describe('isDivingEvent', () => {
    test('returns true for diving event', () => {
      expect(isDivingEvent({ name: 'Diving' })).toBe(true);
    });

    test('returns false for non-diving event', () => {
      expect(isDivingEvent({ name: '100 Freestyle' })).toBe(false);
      expect(isDivingEvent({ name: '200 IM' })).toBe(false);
    });

    test('returns false for relay with Diving in name', () => {
      expect(isDivingEvent({ name: 'Diving Relay' })).toBe(false);
    });

    test('handles null/undefined', () => {
      expect(isDivingEvent(null)).toBe(false);
      expect(isDivingEvent(undefined)).toBe(false);
      expect(isDivingEvent({})).toBe(false);
    });
  });

  describe('isRelayEvent', () => {
    test('returns true for relay events', () => {
      expect(isRelayEvent({ name: '200 Medley Relay' })).toBe(true);
      expect(isRelayEvent({ name: '400 Freestyle Relay' })).toBe(true);
    });

    test('returns false for individual events', () => {
      expect(isRelayEvent({ name: '100 Freestyle' })).toBe(false);
      expect(isRelayEvent({ name: 'Diving' })).toBe(false);
    });

    test('handles null/undefined', () => {
      expect(isRelayEvent(null)).toBe(false);
      expect(isRelayEvent(undefined)).toBe(false);
      expect(isRelayEvent({})).toBe(false);
    });
  });
});

describe('Tie Point Calculation', () => {
  const pointSystem = { 1: 6, 2: 4, 3: 3, 4: 2, 5: 1 };
  const maxPlace = 5;

  describe('calculateTiePoints', () => {
    test('returns full points for single team (no tie)', () => {
      expect(calculateTiePoints(1, 1, pointSystem, maxPlace)).toBe(6);
      expect(calculateTiePoints(3, 1, pointSystem, maxPlace)).toBe(3);
    });

    test('splits points for 2-way tie', () => {
      // Tie for 1st: (6 + 4) / 2 = 5
      expect(calculateTiePoints(1, 2, pointSystem, maxPlace)).toBe(5);

      // Tie for 2nd: (4 + 3) / 2 = 3.5
      expect(calculateTiePoints(2, 2, pointSystem, maxPlace)).toBe(3.5);
    });

    test('splits points for 3-way tie', () => {
      // Tie for 1st: (6 + 4 + 3) / 3 = 4.333...
      expect(calculateTiePoints(1, 3, pointSystem, maxPlace)).toBeCloseTo(4.333, 2);
    });

    test('handles tie at end of scoring places', () => {
      // Tie for 4th and 5th: (2 + 1) / 2 = 1.5
      expect(calculateTiePoints(4, 2, pointSystem, maxPlace)).toBe(1.5);
    });

    test('handles tie extending beyond scoring places', () => {
      // 3-way tie for 4th, but only places 4 and 5 score
      // (2 + 1) / 3 = 1
      expect(calculateTiePoints(4, 3, pointSystem, maxPlace)).toBe(1);
    });

    test('returns 0 when starting beyond max place', () => {
      expect(calculateTiePoints(6, 1, pointSystem, maxPlace)).toBe(0);
    });

    test('returns 0 for invalid inputs', () => {
      expect(calculateTiePoints(1, 0, pointSystem, maxPlace)).toBe(0);
      expect(calculateTiePoints(1, 1, null, maxPlace)).toBe(0);
      expect(calculateTiePoints(1, 1, {}, maxPlace)).toBe(0);
    });
  });
});

describe('Full Score Calculation', () => {
  const teams = [
    { id: 'team1', name: 'Eagles' },
    { id: 'team2', name: 'Hawks' }
  ];

  const pointSystem = { 1: 6, 2: 4, 3: 3, 4: 2, 5: 1 };
  const relayPointSystem = { 1: 8, 2: 4, 3: 2 };
  const divingPointSystem = { 1: 5, 2: 3, 3: 1 };

  const baseParams = {
    teams,
    individualPointSystem: pointSystem,
    relayPointSystem,
    divingPointSystem,
    numIndividualPlaces: 5,
    numRelayPlaces: 3,
    numDivingPlaces: 3,
    teamPlaceLimitEnabled: false
  };

  describe('calculateScores', () => {
    test('calculates simple individual event scores', () => {
      const events = [{
        id: 1,
        name: '100 Freestyle',
        gender: 'girls',
        results: [
          { place: 1, teamIds: ['team1'] },
          { place: 2, teamIds: ['team2'] }
        ]
      }];

      const scores = calculateScores({ ...baseParams, events });

      expect(scores.team1.score).toBe(6);
      expect(scores.team1.girlsScore).toBe(6);
      expect(scores.team1.boysScore).toBe(0);
      expect(scores.team2.score).toBe(4);
    });

    test('calculates relay event scores with correct point system', () => {
      const events = [{
        id: 1,
        name: '200 Medley Relay',
        gender: 'boys',
        results: [
          { place: 1, teamIds: ['team2'] },
          { place: 2, teamIds: ['team1'] }
        ]
      }];

      const scores = calculateScores({ ...baseParams, events });

      expect(scores.team2.score).toBe(8);
      expect(scores.team2.boysScore).toBe(8);
      expect(scores.team1.score).toBe(4);
    });

    test('calculates diving event scores with diving point system', () => {
      const events = [{
        id: 1,
        name: 'Diving',
        gender: 'girls',
        results: [
          { place: 1, teamIds: ['team1'] },
          { place: 2, teamIds: ['team2'] }
        ]
      }];

      const scores = calculateScores({ ...baseParams, events });

      expect(scores.team1.score).toBe(5);
      expect(scores.team2.score).toBe(3);
    });

    test('accumulates scores across multiple events', () => {
      const events = [
        {
          id: 1,
          name: '100 Freestyle',
          gender: 'girls',
          results: [
            { place: 1, teamIds: ['team1'] },
            { place: 2, teamIds: ['team2'] }
          ]
        },
        {
          id: 2,
          name: '200 IM',
          gender: 'girls',
          results: [
            { place: 1, teamIds: ['team2'] },
            { place: 2, teamIds: ['team1'] }
          ]
        }
      ];

      const scores = calculateScores({ ...baseParams, events });

      expect(scores.team1.score).toBe(10); // 6 + 4
      expect(scores.team2.score).toBe(10); // 4 + 6
    });

    test('separates girls and boys scores', () => {
      const events = [
        {
          id: 1,
          name: '100 Freestyle',
          gender: 'girls',
          results: [{ place: 1, teamIds: ['team1'] }]
        },
        {
          id: 2,
          name: '100 Freestyle',
          gender: 'boys',
          results: [{ place: 1, teamIds: ['team1'] }]
        }
      ];

      const scores = calculateScores({ ...baseParams, events });

      expect(scores.team1.score).toBe(12);
      expect(scores.team1.girlsScore).toBe(6);
      expect(scores.team1.boysScore).toBe(6);
    });

    test('returns empty object for invalid inputs', () => {
      expect(calculateScores({ ...baseParams, teams: null, events: [] })).toEqual({});
      expect(calculateScores({ ...baseParams, teams: [], events: null })).toEqual({});
    });

    test('handles events with no results', () => {
      const events = [{ id: 1, name: '100 Freestyle', gender: 'girls', results: [] }];
      const scores = calculateScores({ ...baseParams, events });

      expect(scores.team1.score).toBe(0);
      expect(scores.team2.score).toBe(0);
    });
  });
});

describe('Tie Handling in Full Scoring', () => {
  const teams = [
    { id: 'team1', name: 'Eagles' },
    { id: 'team2', name: 'Hawks' },
    { id: 'team3', name: 'Falcons' }
  ];

  const pointSystem = { 1: 6, 2: 4, 3: 3, 4: 2, 5: 1 };

  const baseParams = {
    teams,
    individualPointSystem: pointSystem,
    relayPointSystem: { 1: 8, 2: 4, 3: 2 },
    divingPointSystem: { 1: 5, 2: 3, 3: 1 },
    numIndividualPlaces: 5,
    numRelayPlaces: 3,
    numDivingPlaces: 3,
    teamPlaceLimitEnabled: false
  };

  test('handles 2-way tie for first place', () => {
    const events = [{
      id: 1,
      name: '100 Freestyle',
      gender: 'girls',
      results: [
        { place: 1, teamIds: ['team1', 'team2'] },
        { place: 3, teamIds: ['team3'] }
      ]
    }];

    const scores = calculateScores({ ...baseParams, events });

    // Tie for 1st: (6 + 4) / 2 = 5 each
    expect(scores.team1.score).toBe(5);
    expect(scores.team2.score).toBe(5);
    // 3rd place gets 3 points
    expect(scores.team3.score).toBe(3);
  });

  test('handles 3-way tie for first place', () => {
    const events = [{
      id: 1,
      name: '100 Freestyle',
      gender: 'girls',
      results: [
        { place: 1, teamIds: ['team1', 'team2', 'team3'] }
      ]
    }];

    const scores = calculateScores({ ...baseParams, events });

    // Tie for 1st: (6 + 4 + 3) / 3 = 4.33 each
    expect(scores.team1.score).toBeCloseTo(4.33, 2);
    expect(scores.team2.score).toBeCloseTo(4.33, 2);
    expect(scores.team3.score).toBeCloseTo(4.33, 2);
  });

  test('handles tie for middle places', () => {
    const events = [{
      id: 1,
      name: '100 Freestyle',
      gender: 'girls',
      results: [
        { place: 1, teamIds: ['team1'] },
        { place: 2, teamIds: ['team2', 'team3'] }
      ]
    }];

    const scores = calculateScores({ ...baseParams, events });

    expect(scores.team1.score).toBe(6);
    // Tie for 2nd: (4 + 3) / 2 = 3.5 each
    expect(scores.team2.score).toBe(3.5);
    expect(scores.team3.score).toBe(3.5);
  });

  test('handles tie at last scoring place', () => {
    const events = [{
      id: 1,
      name: '100 Freestyle',
      gender: 'girls',
      results: [
        { place: 1, teamIds: ['team1'] },
        { place: 2, teamIds: ['team2'] },
        { place: 3, teamIds: ['team3'] },
        { place: 4, teamIds: ['team1'] },
        { place: 5, teamIds: ['team2', 'team3'] }
      ]
    }];

    const scores = calculateScores({ ...baseParams, events });

    // Team1: 6 (1st) + 2 (4th) = 8
    expect(scores.team1.score).toBe(8);
    // Team2: 4 (2nd) + 0.5 (tied 5th, only 1 point available) = 4.5
    expect(scores.team2.score).toBe(4.5);
    // Team3: 3 (3rd) + 0.5 = 3.5
    expect(scores.team3.score).toBe(3.5);
  });

  test('correctly skips consumed places after tie', () => {
    // With a 3-way tie for 1st, the next available place is 4th
    const events = [{
      id: 1,
      name: '100 Freestyle',
      gender: 'girls',
      results: [
        { place: 1, teamIds: ['team1', 'team2', 'team3'] },
        { place: 4, teamIds: ['team1'] }
      ]
    }];

    const scores = calculateScores({ ...baseParams, events });

    // Each gets (6+4+3)/3 = 4.33 from tie, team1 also gets 2 from 4th
    expect(scores.team1.score).toBeCloseTo(6.33, 2);
  });
});

describe('Team Place Limit', () => {
  const teams = [
    { id: 'team1', name: 'Eagles' },
    { id: 'team2', name: 'Hawks' }
  ];

  const baseParams = {
    teams,
    individualPointSystem: { 1: 6, 2: 4, 3: 3, 4: 2, 5: 1 },
    relayPointSystem: { 1: 8, 2: 4, 3: 2 },
    divingPointSystem: { 1: 5, 2: 3, 3: 1 },
    numIndividualPlaces: 5,
    numRelayPlaces: 3,
    numDivingPlaces: 3
  };

  test('does not limit places when disabled', () => {
    const events = [{
      id: 1,
      name: '400 Freestyle Relay',
      gender: 'girls',
      results: [
        { place: 1, teamIds: ['team1'] },
        { place: 2, teamIds: ['team1'] },
        { place: 3, teamIds: ['team1'] }
      ]
    }];

    const scores = calculateScores({
      ...baseParams,
      events,
      teamPlaceLimitEnabled: false
    });

    // Team1 gets all relay places: 8 + 4 + 2 = 14
    expect(scores.team1.score).toBe(14);
  });

  test('limits team to numPlaces - 1 places when enabled', () => {
    const events = [{
      id: 1,
      name: '400 Freestyle Relay',
      gender: 'girls',
      results: [
        { place: 1, teamIds: ['team1'] },
        { place: 2, teamIds: ['team1'] },
        { place: 3, teamIds: ['team1'] }
      ]
    }];

    const scores = calculateScores({
      ...baseParams,
      events,
      teamPlaceLimitEnabled: true
    });

    // With 3 places and limit enabled, team can score at most 2 places
    // Team1 gets 1st and 2nd: 8 + 4 = 12 (3rd doesn't count)
    expect(scores.team1.score).toBe(12);
  });

  test('only applies limit to relay events, not individual', () => {
    const events = [{
      id: 1,
      name: '100 Freestyle',
      gender: 'girls',
      results: [
        { place: 1, teamIds: ['team1'] },
        { place: 2, teamIds: ['team1'] },
        { place: 3, teamIds: ['team1'] },
        { place: 4, teamIds: ['team1'] },
        { place: 5, teamIds: ['team1'] }
      ]
    }];

    const scores = calculateScores({
      ...baseParams,
      events,
      teamPlaceLimitEnabled: true
    });

    // Individual events not limited: 6 + 4 + 3 + 2 + 1 = 16
    expect(scores.team1.score).toBe(16);
  });

  test('does not apply limit to diving events', () => {
    const events = [{
      id: 1,
      name: 'Diving',
      gender: 'girls',
      results: [
        { place: 1, teamIds: ['team1'] },
        { place: 2, teamIds: ['team1'] },
        { place: 3, teamIds: ['team1'] }
      ]
    }];

    const scores = calculateScores({
      ...baseParams,
      events,
      teamPlaceLimitEnabled: true
    });

    // Diving not limited: 5 + 3 + 1 = 9
    expect(scores.team1.score).toBe(9);
  });
});

describe('Result Validation', () => {
  describe('validateResults', () => {
    test('validates empty results', () => {
      const result = validateResults([]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates single result', () => {
      const results = [{ place: 1, teamIds: ['team1'] }];
      expect(validateResults(results).valid).toBe(true);
    });

    test('validates non-conflicting results', () => {
      const results = [
        { place: 1, teamIds: ['team1'] },
        { place: 2, teamIds: ['team2'] },
        { place: 3, teamIds: ['team3'] }
      ];
      expect(validateResults(results).valid).toBe(true);
    });

    test('validates tie followed by correct next place', () => {
      const results = [
        { place: 1, teamIds: ['team1', 'team2'] },
        { place: 3, teamIds: ['team3'] }
      ];
      expect(validateResults(results).valid).toBe(true);
    });

    test('detects place conflict after tie', () => {
      const results = [
        { place: 1, teamIds: ['team1', 'team2'] },
        { place: 2, teamIds: ['team3'] } // Invalid: should be place 3
      ];
      const result = validateResults(results);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    test('detects multiple conflicts', () => {
      const results = [
        { place: 1, teamIds: ['team1', 'team2', 'team3'] },
        { place: 2, teamIds: ['team4'] },
        { place: 3, teamIds: ['team5'] }
      ];
      const result = validateResults(results);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    test('handles null/undefined gracefully', () => {
      expect(validateResults(null).valid).toBe(true);
      expect(validateResults(undefined).valid).toBe(true);
    });
  });

  describe('calculateConsumedPlaces', () => {
    test('returns 0 for empty results', () => {
      expect(calculateConsumedPlaces([], 5)).toBe(0);
    });

    test('counts single placements', () => {
      const results = [
        { place: 1, teamIds: ['team1'] },
        { place: 2, teamIds: ['team2'] }
      ];
      expect(calculateConsumedPlaces(results, 2)).toBe(2);
    });

    test('counts tie as multiple places consumed', () => {
      const results = [
        { place: 1, teamIds: ['team1', 'team2'] }
      ];
      expect(calculateConsumedPlaces(results, 5)).toBe(2);
    });

    test('counts 3-way tie as 3 places consumed', () => {
      const results = [
        { place: 1, teamIds: ['team1', 'team2', 'team3'] }
      ];
      expect(calculateConsumedPlaces(results, 5)).toBe(3);
    });

    test('respects upToPlace limit', () => {
      const results = [
        { place: 1, teamIds: ['team1'] },
        { place: 2, teamIds: ['team2'] },
        { place: 3, teamIds: ['team3'] }
      ];
      expect(calculateConsumedPlaces(results, 2)).toBe(2);
    });
  });
});

describe('Point System Presets', () => {
  test('high school dual meet has correct individual points', () => {
    const hs = POINT_SYSTEMS.highSchoolDual;
    expect(hs.individual[1]).toBe(6);
    expect(hs.individual[2]).toBe(4);
    expect(hs.individual[3]).toBe(3);
    expect(hs.individual[4]).toBe(2);
    expect(hs.individual[5]).toBe(1);
  });

  test('high school dual meet has correct relay points', () => {
    const hs = POINT_SYSTEMS.highSchoolDual;
    expect(hs.relay[1]).toBe(8);
    expect(hs.relay[2]).toBe(4);
    expect(hs.relay[3]).toBe(2);
  });

  test('USA Swimming 6-lane has correct points', () => {
    const usa6 = POINT_SYSTEMS.usaSwimming[6];
    expect(usa6.individual[1]).toBe(7);
    expect(usa6.relay[1]).toBe(14);
  });

  test('USA Swimming relay points are double individual', () => {
    Object.keys(POINT_SYSTEMS.usaSwimming).forEach(lanes => {
      const scoring = POINT_SYSTEMS.usaSwimming[lanes];
      Object.keys(scoring.individual).forEach(place => {
        expect(scoring.relay[place]).toBe(scoring.individual[place] * 2);
      });
    });
  });
});
