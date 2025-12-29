/**
 * Shinroe Reputation System Types
 * Used for trust signals in Pumasi based on Shinroe reputation scores
 */

export interface ShinroeScore {
  address: string;
  score: number;
  tier: ShinroeTier;
  endorsements: number;
  airdropsReceived: number;
  lastUpdated: number;
}

export type ShinroeTier =
  | 'newcomer' // 0-299
  | 'trusted' // 300-499
  | 'established' // 500-699
  | 'verified' // 700-899
  | 'elite'; // 900+

export const SHINROE_TIER_THRESHOLDS: Record<ShinroeTier, number> = {
  newcomer: 0,
  trusted: 300,
  established: 500,
  verified: 700,
  elite: 900,
};

export const SHINROE_TIER_LABELS: Record<ShinroeTier, string> = {
  newcomer: '신규',
  trusted: '신뢰',
  established: '인정',
  verified: '검증',
  elite: '엘리트',
};

export const SHINROE_TIER_COLORS: Record<ShinroeTier, string> = {
  newcomer: 'bg-slate-500/20 text-slate-300 border-slate-500/50',
  trusted: 'bg-green-500/20 text-green-400 border-green-500/50',
  established: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  verified: 'bg-violet/20 text-violet-light border-violet/50',
  elite: 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border-amber-500/50',
};

export const SHINROE_TIER_ICONS: Record<ShinroeTier, string> = {
  newcomer: '🌱',
  trusted: '✓',
  established: '⭐',
  verified: '✓✓',
  elite: '👑',
};

/**
 * Get the tier based on score
 */
export function getScoreTier(score: number): ShinroeTier {
  if (score >= SHINROE_TIER_THRESHOLDS.elite) return 'elite';
  if (score >= SHINROE_TIER_THRESHOLDS.verified) return 'verified';
  if (score >= SHINROE_TIER_THRESHOLDS.established) return 'established';
  if (score >= SHINROE_TIER_THRESHOLDS.trusted) return 'trusted';
  return 'newcomer';
}

/**
 * Check if user is eligible for arbitrator role (requires verified tier - 700+)
 */
export function isArbitratorEligible(score: number): boolean {
  return score >= SHINROE_TIER_THRESHOLDS.verified;
}

/**
 * Raw subgraph response for Shinroe user
 */
export interface ShinroeUserResponse {
  id: string;
  totalEndorsementWeight: string;
  endorsementsReceived: { id: string }[];
  badges: { id: string; badgeType: number }[];
  lastUpdated: string | null;
  registeredAt: string | null;
}
