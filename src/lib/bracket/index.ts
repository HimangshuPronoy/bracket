// ---------------------------------------------------------------------------
// Bracket Engine – Public API
// ---------------------------------------------------------------------------
export * from './types';
export { generateSingleElim } from './singleElim';
export { generateDoubleElim } from './doubleElim';
export { generateRoundRobin } from './roundRobin';
export { reportResult, undoResult } from './results';
export { computeStandings } from './standings';
export { advanceToNextStage } from './advance';
