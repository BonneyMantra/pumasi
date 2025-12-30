/**
 * Arbitrator Eligibility Check
 * Uses Shinroe reputation scores to determine arbitrator eligibility
 */

import { getShinroeScore } from './shinroe';
import { SHINROE_TIER_THRESHOLDS, SHINROE_TIER_LABELS } from '@/lib/types/shinroe';

// Minimum score required to be an arbitrator (verified tier)
const ARBITRATOR_MIN_SCORE = SHINROE_TIER_THRESHOLDS.verified; // 700

export interface ArbitratorEligibility {
  eligible: boolean;
  reason?: string;
  score: number;
  requiredScore: number;
  tier: string | null;
  missingPoints?: number;
}

/**
 * Check if an address is eligible to be an arbitrator
 * Requires "verified" tier (700+ Shinroe score)
 */
export async function checkArbitratorEligibility(
  address: string
): Promise<ArbitratorEligibility> {
  const shinroe = await getShinroeScore(address);

  if (!shinroe) {
    return {
      eligible: false,
      reason: 'Shinroe 프로필이 없습니다',
      score: 0,
      requiredScore: ARBITRATOR_MIN_SCORE,
      tier: null,
      missingPoints: ARBITRATOR_MIN_SCORE,
    };
  }

  const isEligible = shinroe.score >= ARBITRATOR_MIN_SCORE;
  const missingPoints = isEligible ? 0 : ARBITRATOR_MIN_SCORE - shinroe.score;

  return {
    eligible: isEligible,
    reason: !isEligible
      ? `점수가 부족합니다 (${missingPoints}점 더 필요)`
      : undefined,
    score: shinroe.score,
    requiredScore: ARBITRATOR_MIN_SCORE,
    tier: SHINROE_TIER_LABELS[shinroe.tier],
    missingPoints,
  };
}

/**
 * Get eligibility status message
 */
export function getEligibilityMessage(eligibility: ArbitratorEligibility): string {
  if (eligibility.eligible) {
    return `중재자 자격이 있습니다 (${eligibility.tier} 등급)`;
  }

  if (eligibility.score === 0) {
    return 'Shinroe에서 신뢰도를 구축해주세요';
  }

  return `${eligibility.missingPoints}점이 더 필요합니다 (현재: ${eligibility.score}점)`;
}
