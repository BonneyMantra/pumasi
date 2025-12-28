export interface UserProfile {
  address: string;
  shinroeScore?: number;
  averageRating: number;
  totalReviews: number;
  jobsCompleted: number;
  jobsPosted: number;
  totalEarnings: bigint;
  isArbitrator: boolean;
  arbitratorStake?: bigint;
  memberSince: number;
  responseRate?: number;
  // IPFS metadata fields
  profileURI?: string;
  metadata?: ProfileMetadata;
}

/**
 * Profile metadata stored on IPFS (Pinata)
 * This is the professional portfolio data for freelancers
 */
export interface ProfileMetadata {
  // Basic info
  displayName: string;
  bio: string;
  // Images (IPFS hashes)
  avatarHash?: string;
  coverImageHash?: string;
  // Professional details
  title?: string; // e.g., "Full Stack Developer"
  location?: string;
  website?: string;
  // Skills & expertise
  skills: string[];
  languages: string[];
  // Social links
  socials?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    telegram?: string;
  };
  // VeryChat verification
  verychatHandle?: string;
  verychatVerified?: boolean;
  verychatVerifiedAt?: number;
  // Portfolio
  portfolioItems?: PortfolioItem[];
  // Availability
  hourlyRate?: number;
  availability?: 'available' | 'busy' | 'unavailable';
  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export interface PortfolioItem {
  title: string;
  description: string;
  imageHash?: string;
  link?: string;
}

export interface ProfileFormData {
  displayName: string;
  bio: string;
  title?: string;
  location?: string;
  website?: string;
  skills: string[];
  languages: string[];
  hourlyRate?: number;
  availability?: 'available' | 'busy' | 'unavailable';
  socials?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    telegram?: string;
  };
  // VeryChat verification
  verychatHandle?: string;
  verychatVerified?: boolean;
  verychatVerifiedAt?: number;
}

export interface SaveProfileResult {
  uri: string;
  txHash?: `0x${string}`;
}

export interface Review {
  id: string;
  jobId: string;
  jobTitle: string;
  reviewer: string;
  reviewee: string;
  rating: number; // 1-5
  comment: string;
  createdAt: number;
}

export type ShinroeScoreTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export const SHINROE_TIER_THRESHOLDS: Record<ShinroeScoreTier, number> = {
  bronze: 0,
  silver: 300,
  gold: 600,
  platinum: 900,
};

export const SHINROE_TIER_LABELS: Record<ShinroeScoreTier, string> = {
  bronze: '브론즈',
  silver: '실버',
  gold: '골드',
  platinum: '플래티넘',
};

export function getShinroeTier(score: number): ShinroeScoreTier {
  if (score >= SHINROE_TIER_THRESHOLDS.platinum) return 'platinum';
  if (score >= SHINROE_TIER_THRESHOLDS.gold) return 'gold';
  if (score >= SHINROE_TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

export interface ReviewFormData {
  rating: number;
  comment: string;
}
