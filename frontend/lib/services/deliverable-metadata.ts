/**
 * Deliverable Metadata Service
 * Handles IPFS upload for job deliverables
 */

export interface DeliverableMetadata {
  title: string;
  description: string;
  links?: string[];
  submittedAt: number; // Unix timestamp
  jobId: string;
  freelancer: string;
}

export interface IPFSUploadResponse {
  success: boolean;
  ipfsHash: string;
  url: string;
  gatewayUrl: string;
  error?: string;
}

/**
 * Upload deliverable metadata to IPFS via API
 */
export async function uploadDeliverableMetadata(data: DeliverableMetadata): Promise<string> {
  const response = await fetch('/api/ipfs/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: data,
      name: `deliverable-job${data.jobId}-${Date.now()}`,
      metadata: {
        type: 'deliverable-metadata',
        jobId: data.jobId,
        freelancer: data.freelancer,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload deliverable to IPFS');
  }

  const result: IPFSUploadResponse = await response.json();
  return result.ipfsHash;
}

/**
 * Fetch deliverable metadata from IPFS
 */
export async function fetchDeliverableMetadata(ipfsHash: string): Promise<DeliverableMetadata> {
  // Remove ipfs:// prefix if present
  const hash = ipfsHash.replace('ipfs://', '');
  const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
  const response = await fetch(gatewayUrl);

  if (!response.ok) {
    throw new Error('Failed to fetch deliverable metadata from IPFS');
  }

  return response.json();
}
