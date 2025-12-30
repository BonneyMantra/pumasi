/**
 * Job Metadata Service
 * Handles IPFS upload for job metadata
 */

import { JobCategory } from '@/lib/types/job';

export interface JobMetadata {
  title: string;
  description: string;
  category: JobCategory;
  requirements?: string;
  paymentType: 'full' | 'milestone';
  milestones?: MilestoneMetadata[];
}

export interface MilestoneMetadata {
  title: string;
  description?: string;
  amount: string; // In VERY (as string for precision)
  deadline: number; // Unix timestamp
}

export interface IPFSUploadResponse {
  success: boolean;
  ipfsHash: string;
  url: string;
  gatewayUrl: string;
  error?: string;
}

/**
 * Upload job metadata to IPFS via API
 */
export async function uploadJobMetadata(data: JobMetadata): Promise<string> {
  const response = await fetch('/api/ipfs/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: data,
      name: `job-${data.title.slice(0, 20).replace(/\s/g, '-')}-${Date.now()}`,
      metadata: {
        type: 'job-metadata',
        category: data.category,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload metadata to IPFS');
  }

  const result: IPFSUploadResponse = await response.json();
  return result.ipfsHash;
}

/**
 * Fetch job metadata from IPFS
 */
export async function fetchJobMetadata(ipfsHash: string): Promise<JobMetadata> {
  const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  const response = await fetch(gatewayUrl);

  if (!response.ok) {
    throw new Error('Failed to fetch job metadata from IPFS');
  }

  return response.json();
}

/**
 * Validate job metadata before upload
 */
export function validateJobMetadata(data: Partial<JobMetadata>): string[] {
  const errors: string[] = [];

  if (!data.title || data.title.length < 5 || data.title.length > 100) {
    errors.push('제목은 5-100자 사이여야 합니다');
  }

  if (!data.description || data.description.length < 20 || data.description.length > 2000) {
    errors.push('설명은 20-2000자 사이여야 합니다');
  }

  if (!data.category) {
    errors.push('카테고리를 선택해주세요');
  }

  if (data.paymentType === 'milestone' && (!data.milestones || data.milestones.length === 0)) {
    errors.push('마일스톤을 최소 1개 이상 추가해주세요');
  }

  return errors;
}
