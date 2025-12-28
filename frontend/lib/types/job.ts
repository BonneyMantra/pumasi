export interface Job {
  id: string;
  client: string;
  freelancer?: string;
  title: string;
  description: string;
  category: JobCategory;
  budget: bigint;
  deadline: number;
  status: JobStatus;
  metadataURI: string;
  createdAt: number;
  applicationCount?: number;
}

export type JobCategory =
  | 'translation'
  | 'design'
  | 'writing'
  | 'development'
  | 'tutoring'
  | 'data_entry'
  | 'delivery'
  | 'misc';

export type JobStatus =
  | 'open'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  translation: '번역',
  design: '디자인',
  writing: '글쓰기',
  development: '개발',
  tutoring: '튜터링',
  data_entry: '데이터 입력',
  delivery: '배달',
  misc: '기타',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  open: '모집중',
  in_progress: '진행중',
  delivered: '제출됨',
  completed: '완료',
  disputed: '분쟁중',
  cancelled: '취소됨',
};

export interface JobFilters {
  categories?: JobCategory[];
  status?: JobStatus[];
  minBudget?: bigint;
  maxBudget?: bigint;
  search?: string;
}

// Note: Application type moved to application.ts

export interface Milestone {
  id: string;
  jobId: string;
  title: string;
  description: string;
  amount: bigint;
  deadline: number;
  status: 'pending' | 'in_progress' | 'delivered' | 'approved';
  deliveryURI?: string;
}

export interface Delivery {
  id: string;
  jobId: string;
  milestoneId?: string;
  description: string;
  fileURIs: string[];
  notes: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'revision_requested';
  revisionReason?: string;
}

export type JobEvent =
  | 'created'
  | 'freelancer_assigned'
  | 'work_started'
  | 'delivery_submitted'
  | 'delivery_approved'
  | 'revision_requested'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export interface JobTimelineEvent {
  id: string;
  jobId: string;
  event: JobEvent;
  timestamp: number;
  actor: string;
  metadata?: Record<string, string>;
}
