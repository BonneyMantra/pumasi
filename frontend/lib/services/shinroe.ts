/**
 * Shinroe Reputation Service
 * Fetches reputation scores from the Shinroe subgraph
 */

import { SHINROE_SUBGRAPH_URL } from '@/lib/config/subgraph';
import {
  ShinroeScore,
  ShinroeUserResponse,
  getScoreTier,
} from '@/lib/types/shinroe';

const SHINROE_USER_QUERY = `
  query GetShinroeUser($address: ID!) {
    user(id: $address) {
      id
      totalEndorsementWeight
      endorsementsReceived {
        id
      }
      badges {
        id
        badgeType
      }
      lastUpdated
      registeredAt
    }
  }
`;

const SHINROE_AIRDROP_COUNT_QUERY = `
  query GetAirdropCount($address: ID!) {
    airdropClaims(where: { claimer: $address }) {
      id
    }
  }
`;

/**
 * Calculate score from endorsement weight
 * Score is based on total endorsement weight (in wei)
 * 1 endorsement with 0.1 VERY stake = 10 points
 */
function calculateScore(endorsementWeight: bigint): number {
  // Convert from wei to score points (rough approximation)
  // 1e17 wei (0.1 VERY) = 10 points
  const scoreBase = Number(endorsementWeight / BigInt(1e16));
  return Math.min(scoreBase, 1000); // Cap at 1000
}

/**
 * Fetch Shinroe score for an address
 */
export async function getShinroeScore(
  address: string
): Promise<ShinroeScore | null> {
  try {
    const normalizedAddress = address.toLowerCase();

    // Fetch user data and airdrop claims in parallel
    const [userResponse, airdropResponse] = await Promise.all([
      fetch(SHINROE_SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: SHINROE_USER_QUERY,
          variables: { address: normalizedAddress },
        }),
      }),
      fetch(SHINROE_SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: SHINROE_AIRDROP_COUNT_QUERY,
          variables: { address: normalizedAddress },
        }),
      }),
    ]);

    const userData = await userResponse.json();
    const airdropData = await airdropResponse.json();

    const user: ShinroeUserResponse | null = userData.data?.user;

    if (!user) {
      return null;
    }

    const endorsementWeight = BigInt(user.totalEndorsementWeight || '0');
    const score = calculateScore(endorsementWeight);
    const endorsements = user.endorsementsReceived?.length || 0;
    const airdropsReceived = airdropData.data?.airdropClaims?.length || 0;
    const lastUpdated = user.lastUpdated
      ? parseInt(user.lastUpdated)
      : user.registeredAt
        ? parseInt(user.registeredAt)
        : 0;

    return {
      address: normalizedAddress,
      score,
      tier: getScoreTier(score),
      endorsements,
      airdropsReceived,
      lastUpdated,
    };
  } catch (error) {
    console.error('Failed to fetch Shinroe score:', error);
    return null;
  }
}

/**
 * Batch fetch Shinroe scores for multiple addresses
 */
export async function getShinroeScores(
  addresses: string[]
): Promise<Map<string, ShinroeScore>> {
  const results = new Map<string, ShinroeScore>();

  // Fetch in parallel with max concurrency
  const batchSize = 5;
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const scores = await Promise.all(batch.map(getShinroeScore));

    scores.forEach((score, index) => {
      if (score) {
        results.set(batch[index].toLowerCase(), score);
      }
    });
  }

  return results;
}
