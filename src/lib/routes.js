// =====================================================================
// ROUTE PATHS
// =====================================================================
export const PATHS = {
  home: '/',
  bio: '/bio',
  contact: '/contact',
  whereToStart: '/tools/where-to-start',
  threeMoments: '/tools/self/three-moments',
  lcp: '/tools/self/lcp',
  leadershipCapacities: '/tools/self/leadership-capacities',
  fiveLives: '/tools/self/five-lives',
  smallestViableExperiment: '/tools/self/smallest-viable-experiment',
  purposeSmallMoves: '/tools/self/purpose-small-moves',
  emotionsAsInformation: '/tools/self/emotions-as-information',
  readiness: '/tools/org/readiness',
  vision: '/tools/org/vision',
  preMortem: '/tools/team/pre-mortem',
  challengeMapper: '/tools/team/challenge-mapper',
  think: '/think',
  fiveLayersDeep: '/think/five-layers-deep',
  cynefin: '/think/cynefin',
};

export const STATE_TO_PATH = {
  home: PATHS.home,
  bio: PATHS.bio,
  contact: PATHS.contact,
  'where-to-start': PATHS.whereToStart,
  'three-moments': PATHS.threeMoments,
  lcp: PATHS.lcp,
  'leadership-capacities': PATHS.leadershipCapacities,
  // Backward-compat: old key/path so any existing `navigate('leadership-stance')` calls still work
  'leadership-stance': PATHS.leadershipCapacities,
  'five-lives': PATHS.fiveLives,
  'smallest-viable-experiment': PATHS.smallestViableExperiment,
  'purpose-small-moves': PATHS.purposeSmallMoves,
  'emotions-as-information': PATHS.emotionsAsInformation,
  readiness: PATHS.readiness,
  vision: PATHS.vision,
  'pre-mortem': PATHS.preMortem,
  'challenge-mapper': PATHS.challengeMapper,
  think: PATHS.think,
  'five-layers-deep': PATHS.fiveLayersDeep,
  cynefin: PATHS.cynefin,
};
