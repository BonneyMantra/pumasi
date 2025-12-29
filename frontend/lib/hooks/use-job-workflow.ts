'use client';

import { useState, useEffect, useCallback } from 'react';
import { Delivery, Milestone, JobTimelineEvent } from '@/lib/types/job';
import { parseEther } from 'viem';

// Mock data for development
const MOCK_MILESTONES: Milestone[] = [
  {
    id: '1',
    jobId: '3',
    title: '디자인 목업',
    description: '와이어프레임 및 UI 디자인 목업 제작',
    amount: parseEther('100'),
    deadline: Math.floor(Date.now() / 1000) + 7 * 86400,
    status: 'approved',
  },
  {
    id: '2',
    jobId: '3',
    title: '프론트엔드 개발',
    description: 'React 컴포넌트 및 페이지 구현',
    amount: parseEther('250'),
    deadline: Math.floor(Date.now() / 1000) + 14 * 86400,
    status: 'in_progress',
  },
  {
    id: '3',
    jobId: '3',
    title: 'Web3 통합',
    description: '스마트 컨트랙트 연동 및 테스트',
    amount: parseEther('150'),
    deadline: Math.floor(Date.now() / 1000) + 21 * 86400,
    status: 'pending',
  },
];

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: '1',
    jobId: '3',
    description: '1차 마일스톤 완료 - 디자인 목업',
    fileURIs: [
      'ipfs://bafkreibc6vde6maoj63wv47rsyi3eg5kyzpc5hflqho5htvgkg4k6eraca', // UI design
      'ipfs://bafkreickpll3arzlgzwd6zzh6wplmqgsfuvufz3psuxb3hcpc4wy3tpi7i', // Logo
    ],
    notes: 'Figma 파일 및 PNG 에셋 포함되어 있습니다.',
    submittedAt: Math.floor(Date.now() / 1000) - 3 * 86400,
    status: 'approved',
  },
];

const MOCK_TIMELINE: JobTimelineEvent[] = [
  {
    id: '1',
    jobId: '3',
    event: 'created',
    timestamp: Math.floor(Date.now() / 1000) - 10 * 86400,
    actor: '0x3456789012345678901234567890123456789012',
  },
  {
    id: '2',
    jobId: '3',
    event: 'freelancer_assigned',
    timestamp: Math.floor(Date.now() / 1000) - 9 * 86400,
    actor: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
  },
  {
    id: '3',
    jobId: '3',
    event: 'work_started',
    timestamp: Math.floor(Date.now() / 1000) - 8 * 86400,
    actor: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
  },
  {
    id: '4',
    jobId: '3',
    event: 'delivery_submitted',
    timestamp: Math.floor(Date.now() / 1000) - 3 * 86400,
    actor: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
    metadata: { milestoneId: '1' },
  },
  {
    id: '5',
    jobId: '3',
    event: 'delivery_approved',
    timestamp: Math.floor(Date.now() / 1000) - 2 * 86400,
    actor: '0x3456789012345678901234567890123456789012',
    metadata: { milestoneId: '1' },
  },
];

interface SubmitDeliveryParams {
  description: string;
  fileURIs: string[];
  notes: string;
  milestoneId?: string;
}

interface RevisionParams {
  deliveryId: string;
  reason: string;
  feedback?: string;
}

// ========== Submit Delivery Hook ==========
export function useSubmitDelivery(jobId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (params: SubmitDeliveryParams) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Call smart contract
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Submitting delivery:', { jobId, ...params });
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit delivery');
    } finally {
      setIsSubmitting(false);
    }
  }, [jobId]);

  return { submit, isSubmitting, isSuccess, error };
}

// ========== Approve Delivery Hook ==========
export function useApproveDelivery(jobId: string) {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async (deliveryId: string) => {
    setIsApproving(true);
    setError(null);

    try {
      // TODO: Call smart contract to release funds
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Approving delivery:', { jobId, deliveryId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve delivery');
    } finally {
      setIsApproving(false);
    }
  }, [jobId]);

  return { approve, isApproving, error };
}

// ========== Request Revision Hook ==========
export function useRequestRevision(jobId: string) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestRevision = useCallback(async (params: RevisionParams) => {
    setIsRequesting(true);
    setError(null);

    try {
      // TODO: Call smart contract
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Requesting revision:', { jobId, ...params });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request revision');
    } finally {
      setIsRequesting(false);
    }
  }, [jobId]);

  return { requestRevision, isRequesting, error };
}

// ========== Milestones Hook ==========
export function useMilestones(jobId: string) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMilestones() {
      setIsLoading(true);
      try {
        // TODO: Fetch from subgraph
        await new Promise((resolve) => setTimeout(resolve, 300));
        setMilestones(MOCK_MILESTONES.filter((m) => m.jobId === jobId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch milestones');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMilestones();
  }, [jobId]);

  return { milestones, isLoading, error };
}

// ========== Approve Milestone Hook ==========
export function useApproveMilestone(milestoneId: string) {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async () => {
    setIsApproving(true);
    setError(null);

    try {
      // TODO: Call smart contract
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Approving milestone:', milestoneId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve milestone');
    } finally {
      setIsApproving(false);
    }
  }, [milestoneId]);

  return { approve, isApproving, error };
}

// ========== Deliveries Hook ==========
export function useDeliveries(jobId: string) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeliveries() {
      setIsLoading(true);
      try {
        // TODO: Fetch from subgraph
        await new Promise((resolve) => setTimeout(resolve, 300));
        setDeliveries(MOCK_DELIVERIES.filter((d) => d.jobId === jobId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch deliveries');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeliveries();
  }, [jobId]);

  return { deliveries, isLoading, error };
}

// ========== Timeline Hook ==========
export function useJobTimeline(jobId: string) {
  const [events, setEvents] = useState<JobTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimeline() {
      setIsLoading(true);
      try {
        // TODO: Fetch from subgraph
        await new Promise((resolve) => setTimeout(resolve, 300));
        setEvents(MOCK_TIMELINE.filter((e) => e.jobId === jobId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch timeline');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTimeline();
  }, [jobId]);

  return { events, isLoading, error };
}
