// ============================================================================
// ROUTE PATHS
// ============================================================================
// Single source of truth for all route paths. Use these constants in
// navigate() calls so renaming a route only needs one edit.
// ============================================================================

export const PATHS = {
  home: '/',
  bio: '/bio',
  contact: '/contact',
  whereToStart: '/tools/where-to-start',
  threeMoments: '/tools/self/three-moments',
  lcp: '/tools/self/lcp',
  leadershipStance: '/tools/self/leadership-stance',
  readiness: '/tools/org/readiness',
  vision: '/tools/org/vision',
  preMortem: '/tools/team/pre-mortem',
  think: '/think',
  fiveLayersDeep: '/think/five-layers-deep',
};

// Map from old v13 page-state IDs to PATHS, so the existing
// navigate('lcp') style calls keep working during the port.
export const STATE_TO_PATH = {
  home: PATHS.home,
  bio: PATHS.bio,
  contact: PATHS.contact,
  'where-to-start': PATHS.whereToStart,
  'three-moments': PATHS.threeMoments,
  lcp: PATHS.lcp,
  'leadership-stance': PATHS.leadershipStance,
  readiness: PATHS.readiness,
  vision: PATHS.vision,
  'pre-mortem': PATHS.preMortem,
  think: PATHS.think,
  'five-layers-deep': PATHS.fiveLayersDeep,
};
