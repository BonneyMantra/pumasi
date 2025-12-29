export interface Dispute {
  id: string;
  jobId: string;
  client: string;
  freelancer: string;
  status: DisputeStatus;
  clientEvidence?: string;
  freelancerEvidence?: string;
  evidenceDeadline: number;
  voteDeadline: number;
  votes: Vote[];
  resolution?: VoteDecision;
  createdAt: number;
}

export type DisputeStatus = 'evidence' | 'voting' | 'resolved';

export type VoteDecision = 'full_to_client' | 'full_to_freelancer' | 'split';

export interface Vote {
  arbitrator: string;
  decision: VoteDecision;
  rationale: string;
  timestamp: number;
}

export interface Arbitrator {
  address: string;
  stake: bigint;
  casesHandled: number;
  accuracyRate: number;
  earnings: bigint;
  isActive: boolean;
  registeredAt: number;
}

export interface EvidenceFormData {
  description: string;
  fileURIs: string[];
}

export interface VoteFormData {
  decision: VoteDecision;
  rationale: string;
}

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  evidence: '증거 제출 중',
  voting: '투표 중',
  resolved: '해결됨',
};

export const VOTE_DECISION_LABELS: Record<VoteDecision, string> = {
  full_to_client: '클라이언트에게 전액 환불',
  full_to_freelancer: '프리랜서에게 전액 지급',
  split: '50/50 분할',
};
