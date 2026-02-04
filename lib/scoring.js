/**
 * Scoring Logic Module
 *
 * Pure functions for swim meet scoring calculations.
 * Extracted from app.jsx for testability.
 */

/**
 * Determines if an event is a diving event
 * @param {Object} event - Event object with name property
 * @returns {boolean}
 */
function isDivingEvent(event) {
  return !!(event && event.name === 'Diving');
}

/**
 * Determines if an event is a relay event
 * @param {Object} event - Event object with name property
 * @returns {boolean}
 */
function isRelayEvent(event) {
  return !!(event && event.name && event.name.includes('Relay'));
}

/**
 * Calculate points for tied teams at a given place
 *
 * When multiple teams tie for a place, the points for all places they would
 * occupy are summed and split evenly.
 *
 * Example: 3-way tie for 1st with points [6,4,3,2,1]
 * Total = 6 + 4 + 3 = 13, each team gets 13/3 = 4.33...
 *
 * @param {number} startPlace - The place where the tie starts (1-indexed)
 * @param {number} numTied - Number of teams tied
 * @param {Object} pointSystem - Map of place number to points
 * @param {number} maxPlace - Maximum scoring place
 * @returns {number} Points per team
 */
function calculateTiePoints(startPlace, numTied, pointSystem, maxPlace) {
  if (!pointSystem || numTied <= 0 || startPlace > maxPlace) {
    return 0;
  }

  let totalPoints = 0;
  for (let i = 0; i < numTied && (startPlace + i) <= maxPlace; i++) {
    totalPoints += pointSystem[startPlace + i] || 0;
  }

  return totalPoints / numTied;
}

/**
 * Calculate scores for all teams across all events
 *
 * @param {Object} params - Scoring parameters
 * @param {Array} params.teams - Array of team objects with id property
 * @param {Array} params.events - Array of event objects with results
 * @param {Object} params.individualPointSystem - Points for individual events
 * @param {Object} params.relayPointSystem - Points for relay events
 * @param {Object} params.divingPointSystem - Points for diving events
 * @param {number} params.numIndividualPlaces - Number of scoring places for individual
 * @param {number} params.numRelayPlaces - Number of scoring places for relays
 * @param {number} params.numDivingPlaces - Number of scoring places for diving
 * @param {boolean} params.teamPlaceLimitEnabled - Whether to limit team places in relays
 * @returns {Object} Map of teamId to { score, girlsScore, boysScore }
 */
function calculateScores(params) {
  const {
    teams,
    events,
    individualPointSystem,
    relayPointSystem,
    divingPointSystem,
    numIndividualPlaces,
    numRelayPlaces,
    numDivingPlaces,
    teamPlaceLimitEnabled
  } = params;

  if (!Array.isArray(teams) || !Array.isArray(events)) {
    return {};
  }

  const scores = {};
  const girlsScores = {};
  const boysScores = {};

  // Initialize scores for all teams
  teams.forEach(team => {
    if (team && team.id) {
      scores[team.id] = 0;
      girlsScores[team.id] = 0;
      boysScores[team.id] = 0;
    }
  });

  // Process each event
  events.forEach(event => {
    if (!event || !event.results || !Array.isArray(event.results)) return;

    const isDiving = isDivingEvent(event);
    const isRelay = isRelayEvent(event);
    const pointSystem = isDiving ? divingPointSystem : isRelay ? relayPointSystem : individualPointSystem;
    const numPlaces = isDiving ? numDivingPlaces : isRelay ? numRelayPlaces : numIndividualPlaces;

    // Team place limit only applies to relays
    const applyTeamLimit = teamPlaceLimitEnabled && isRelay;
    const maxTeamPlaces = applyTeamLimit ? Math.max(1, numPlaces - 1) : numPlaces;

    // Track scoring places per team for this event
    const teamScoringPlaceCount = {};

    // Group results by place
    const resultsByPlace = {};
    event.results.forEach(result => {
      if (!result || !result.place || !result.teamIds || !Array.isArray(result.teamIds)) return;
      resultsByPlace[result.place] = result.teamIds;
    });

    // Calculate points with tie handling
    let currentPlace = 1;

    while (currentPlace <= numPlaces) {
      const teamsAtPlace = resultsByPlace[currentPlace];

      if (teamsAtPlace && teamsAtPlace.length > 0) {
        const numTied = teamsAtPlace.length;

        // Filter teams that haven't exceeded their place limit
        const eligibleTeams = teamsAtPlace.filter(teamId => {
          if (!applyTeamLimit) return true;
          const currentCount = teamScoringPlaceCount[teamId] || 0;
          return currentCount < maxTeamPlaces;
        });

        if (eligibleTeams.length > 0) {
          const pointsPerTeam = calculateTiePoints(currentPlace, eligibleTeams.length, pointSystem, numPlaces);

          eligibleTeams.forEach(teamId => {
            if (teamId) {
              scores[teamId] = (scores[teamId] || 0) + pointsPerTeam;

              if (event.gender === 'girls') {
                girlsScores[teamId] = (girlsScores[teamId] || 0) + pointsPerTeam;
              } else if (event.gender === 'boys') {
                boysScores[teamId] = (boysScores[teamId] || 0) + pointsPerTeam;
              }

              teamScoringPlaceCount[teamId] = (teamScoringPlaceCount[teamId] || 0) + 1;
            }
          });
        }

        // Skip places consumed by this tie
        currentPlace += numTied;
      } else {
        currentPlace++;
      }
    }
  });

  // Build result with rounded scores
  const result = {};
  teams.forEach(team => {
    if (team && team.id) {
      result[team.id] = {
        score: Math.round((scores[team.id] || 0) * 100) / 100,
        girlsScore: Math.round((girlsScores[team.id] || 0) * 100) / 100,
        boysScore: Math.round((boysScores[team.id] || 0) * 100) / 100
      };
    }
  });

  return result;
}

/**
 * Calculate how many places are consumed by ties at or before a given place
 *
 * @param {Array} results - Array of result objects with place and teamIds
 * @param {number} upToPlace - Calculate consumption up to this place
 * @returns {number} Number of places consumed
 */
function calculateConsumedPlaces(results, upToPlace) {
  if (!Array.isArray(results)) return 0;

  let consumed = 0;
  let currentPlace = 1;

  // Sort results by place
  const sortedResults = [...results].sort((a, b) => (a.place || 0) - (b.place || 0));

  for (const result of sortedResults) {
    if (!result || !result.place || !result.teamIds) continue;
    if (result.place > upToPlace) break;

    const numTied = result.teamIds.length;
    consumed += numTied;
    currentPlace = result.place + numTied;
  }

  return consumed;
}

/**
 * Validate that results don't have overlapping places
 * (e.g., can't have teams at place 2 if there's a 3-way tie at place 1)
 *
 * @param {Array} results - Array of result objects
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateResults(results) {
  const errors = [];

  if (!Array.isArray(results)) {
    return { valid: true, errors: [] };
  }

  // Sort by place
  const sortedResults = [...results]
    .filter(r => r && r.place && r.teamIds)
    .sort((a, b) => a.place - b.place);

  let nextValidPlace = 1;

  for (const result of sortedResults) {
    if (result.place < nextValidPlace) {
      errors.push(`Place ${result.place} conflicts with earlier tie (next valid place is ${nextValidPlace})`);
    }

    // After this result, next valid place is current + number of teams
    if (result.place >= nextValidPlace) {
      nextValidPlace = result.place + result.teamIds.length;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Standard point systems
 */
const POINT_SYSTEMS = {
  // High School Dual Meet (default)
  highSchoolDual: {
    individual: { 1: 6, 2: 4, 3: 3, 4: 2, 5: 1 },
    relay: { 1: 8, 2: 4, 3: 2 },
    diving: { 1: 5, 2: 3, 3: 1 }
  },

  // USA Swimming by lane count
  usaSwimming: {
    4: { individual: { 1: 5, 2: 3, 3: 2, 4: 1 }, relay: { 1: 10, 2: 6, 3: 4, 4: 2 } },
    5: { individual: { 1: 6, 2: 4, 3: 3, 4: 2, 5: 1 }, relay: { 1: 12, 2: 8, 3: 6, 4: 4, 5: 2 } },
    6: { individual: { 1: 7, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1 }, relay: { 1: 14, 2: 10, 3: 8, 4: 6, 5: 4, 6: 2 } },
    8: { individual: { 1: 9, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 }, relay: { 1: 18, 2: 14, 3: 12, 4: 10, 5: 8, 6: 6, 7: 4, 8: 2 } }
  }
};

// CommonJS exports for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isDivingEvent,
    isRelayEvent,
    calculateTiePoints,
    calculateScores,
    calculateConsumedPlaces,
    validateResults,
    POINT_SYSTEMS
  };
}

// ES module exports if needed
if (typeof window !== 'undefined') {
  window.ScoringLib = {
    isDivingEvent,
    isRelayEvent,
    calculateTiePoints,
    calculateScores,
    calculateConsumedPlaces,
    validateResults,
    POINT_SYSTEMS
  };
}
