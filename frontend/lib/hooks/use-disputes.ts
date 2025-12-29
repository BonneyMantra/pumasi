'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dispute,
  Arbitrator,
  EvidenceFormData,
  VoteFormData,
  DisputeStatus,
} from '@/lib/types/dispute';
import { querySubgraph, fetchIPFSMetadata } from '@/lib/graphql/client';
import {
  DISPUTE_BY_JOB_QUERY,
  ACTIVE_DISPUTES_QUERY,
  USER_DISPUTES_QUERY,
  ARBITRATORS_QUERY,
  DisputeResult,
  UserResult,
} from '@/lib/graphql/queries/pumasi-queries';

interface UseDisputeResult {
  dispute: Dispute | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseDisputesResult {
  disputes: Dispute[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseArbitratorStatusResult {
  arbitrator: Arbitrator | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Map subgraph status to app status
function mapDisputeStatus(status: string): DisputeStatus {
  const statusMap: Record<string, DisputeStatus> = {
    EvidencePhase: 'evidence',
    VotingPhase: 'voting',
    Resolved: 'resolved',
  };
  return statusMap[status] || 'evidence';
}

// Extended dispute result with job data
interface ExtendedDisputeResult extends DisputeResult {
  job: {
    id: string;
    client?: { id: string };
    freelancer?: { id: string };
    budget?: string;
    metadataURI?: string;
  };
}

// Transform subgraph dispute to app Dispute type
function transformDispute(result: DisputeResult | ExtendedDisputeResult): Dispute {
  const extResult = result as ExtendedDisputeResult;
  const now = Math.floor(Date.now() / 1000);
  // Default deadlines - 7 days for evidence, 3 days for voting
  const evidenceDeadline = now + 7 * 24 * 60 * 60;
  const voteDeadline = now + 10 * 24 * 60 * 60;

  return {
    id: result.id,
    jobId: result.job.id,
    client: extResult.job.client?.id || '',
    freelancer: extResult.job.freelancer?.id || '',
    status: mapDisputeStatus(result.status),
    clientEvidence: result.clientEvidenceURI || undefined,
    freelancerEvidence: result.freelancerEvidenceURI || undefined,
    evidenceDeadline,
    voteDeadline,
    votes: [],
    resolution: result.resolution as Dispute['resolution'],
    createdAt: now,
  };
}

/**
 * Hook to fetch a single dispute by ID
 */
export function useDispute(disputeId: string): UseDisputeResult {
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchDispute() {
      if (!disputeId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await querySubgraph<{ dispute: DisputeResult | null }>(
          DISPUTE_BY_JOB_QUERY,
          { jobId: disputeId }
        );

        if (data.dispute) {
          setDispute(transformDispute(data.dispute));
        } else {
          setDispute(null);
          setError('Dispute not found');
        }
      } catch (err) {
        console.error('Failed to fetch dispute:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dispute');
        setDispute(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDispute();
  }, [disputeId, refreshKey]);

  return { dispute, isLoading, error, refetch };
}

/**
 * Hook to fetch disputes for the current user (as client or freelancer)
 */
export function useMyDisputes(address?: string): UseDisputesResult {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchDisputes() {
      if (!address) {
        setDisputes([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await querySubgraph<{ disputes: ExtendedDisputeResult[] }>(
          USER_DISPUTES_QUERY,
          { userAddress: address.toLowerCase(), first: 100, skip: 0 }
        );

        const transformed = data.disputes.map(transformDispute);
        setDisputes(transformed);
      } catch (err) {
        console.error('Failed to fetch user disputes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch disputes');
        setDisputes([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDisputes();
  }, [address, refreshKey]);

  return { disputes, isLoading, error, refetch };
}

/**
 * Hook to raise a dispute on a job
 * TODO: Connect to contract when deployed
 */
export function useRaiseDispute(jobId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const raiseDispute = useCallback(
    async (reason: string, description: string, evidenceFiles: string[]) => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual contract call
        console.log('Raising dispute:', { jobId, reason, description, evidenceFiles });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setTxHash('0x' + Math.random().toString(16).slice(2, 66));
      } catch (err) {
        console.error('Failed to raise dispute:', err);
        setError(err instanceof Error ? err.message : 'Failed to raise dispute');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [jobId]
  );

  return { raiseDispute, isLoading, error, txHash };
}

/**
 * Hook to submit evidence for a dispute
 * TODO: Connect to contract when deployed
 */
export function useSubmitEvidence(disputeId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const submitEvidence = useCallback(
    async (data: EvidenceFormData) => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual contract call
        console.log('Submitting evidence:', { disputeId, ...data });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setTxHash('0x' + Math.random().toString(16).slice(2, 66));
      } catch (err) {
        console.error('Failed to submit evidence:', err);
        setError(err instanceof Error ? err.message : 'Failed to submit evidence');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [disputeId]
  );

  return { submitEvidence, isLoading, error, txHash };
}

/**
 * Hook to cast a vote on a dispute (for arbitrators)
 * TODO: Connect to contract when deployed
 */
export function useCastVote(disputeId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const castVote = useCallback(
    async (data: VoteFormData) => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual contract call
        console.log('Casting vote:', { disputeId, ...data });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setTxHash('0x' + Math.random().toString(16).slice(2, 66));
      } catch (err) {
        console.error('Failed to cast vote:', err);
        setError(err instanceof Error ? err.message : 'Failed to cast vote');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [disputeId]
  );

  return { castVote, isLoading, error, txHash };
}

/**
 * Hook to register as an arbitrator
 * TODO: Connect to contract when deployed
 */
export function useRegisterArbitrator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const register = useCallback(async (stakeAmount: bigint) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual contract call
      console.log('Registering as arbitrator with stake:', stakeAmount.toString());
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTxHash('0x' + Math.random().toString(16).slice(2, 66));
    } catch (err) {
      console.error('Failed to register:', err);
      setError(err instanceof Error ? err.message : 'Failed to register');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { register, isLoading, error, txHash };
}

/**
 * Hook to check current user's arbitrator status
 */
export function useMyArbitratorStatus(address?: string): UseArbitratorStatusResult {
  const [arbitrator, setArbitrator] = useState<Arbitrator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchStatus() {
      if (!address) {
        setArbitrator(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await querySubgraph<{ user: UserResult | null }>(
          `query GetArbitratorStatus($id: ID!) {
            user(id: $id) {
              id
              isArbitrator
              arbitratorStake
              averageRating
              totalJobsCompleted
            }
          }`,
          { id: address.toLowerCase() }
        );

        if (data.user?.isArbitrator) {
          setArbitrator({
            address: data.user.id,
            stake: BigInt(data.user.arbitratorStake || '0'),
            casesHandled: data.user.totalJobsCompleted,
            accuracyRate: parseFloat(data.user.averageRating || '0'),
            earnings: BigInt(0),
            isActive: true,
            registeredAt: 0,
          });
        } else {
          setArbitrator(null);
        }
      } catch (err) {
        console.error('Failed to fetch arbitrator status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
        setArbitrator(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, [address, refreshKey]);

  return {
    arbitrator,
    isRegistered: !!arbitrator,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch disputes available for arbitrator voting
 */
export function useArbitratorDisputes(): UseDisputesResult {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchDisputes() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await querySubgraph<{ disputes: DisputeResult[] }>(
          ACTIVE_DISPUTES_QUERY,
          { first: 100, skip: 0 }
        );

        const transformed = data.disputes.map(transformDispute);
        setDisputes(transformed);
      } catch (err) {
        console.error('Failed to fetch disputes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch disputes');
        setDisputes([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDisputes();
  }, [refreshKey]);

  return { disputes, isLoading, error, refetch };
}
