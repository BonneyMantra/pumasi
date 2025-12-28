export interface Application {
  id: string;
  jobId: string;
  freelancer: string;
  status: ApplicationStatus;
  proposalURI: string;
  createdAt: number;
  // Resolved from IPFS:
  coverLetter?: string;
  proposedTimeline?: string;
  portfolioLinks?: string[];
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: '대기중',
  accepted: '수락됨',
  rejected: '거절됨',
};

export interface ApplicationFormData {
  coverLetter: string;
  proposedTimeline: string;
  portfolioLinks: string[];
  termsAccepted: boolean;
}

export interface ApplicationFilters {
  status?: ApplicationStatus[];
  sortBy?: 'date' | 'score';
  sortOrder?: 'asc' | 'desc';
}

export const APPLICATION_STATUS_VARIANT: Record<
  ApplicationStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
};
