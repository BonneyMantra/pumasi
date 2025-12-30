/**
 * GraphQL Client for Pumasi Subgraph
 * Fetches real blockchain data from TheGraph
 */

import { PUMASI_SUBGRAPH_URL } from '@/lib/config/subgraph';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Execute a GraphQL query against the Pumasi subgraph
 */
export interface QueryOptions {
  /** Suppress console.error for expected errors like missing fields */
  silent?: boolean;
}

export async function querySubgraph<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: QueryOptions
): Promise<T> {
  const response = await fetch(PUMASI_SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Subgraph query failed: ${response.status}`);
  }

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors?.length) {
    if (!options?.silent) {
      console.error('Subgraph errors:', result.errors);
    }
    throw new Error(result.errors[0].message);
  }

  if (!result.data) {
    throw new Error('No data returned from subgraph');
  }

  return result.data;
}

/**
 * In-memory cache for IPFS metadata with TTL
 */
const ipfsCache = new Map<string, { data: unknown; timestamp: number }>();
const IPFS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch IPFS metadata and parse as JSON (with caching)
 */
export async function fetchIPFSMetadata<T>(ipfsUri: string): Promise<T | null> {
  if (!ipfsUri) return null;

  // Check cache first
  const cached = ipfsCache.get(ipfsUri);
  if (cached && Date.now() - cached.timestamp < IPFS_CACHE_TTL) {
    return cached.data as T;
  }

  try {
    const url = ipfsUri.startsWith('ipfs://')
      ? ipfsUri.replace('ipfs://', 'https://ipfs.io/ipfs/')
      : ipfsUri;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();

    // Cache the result
    ipfsCache.set(ipfsUri, { data, timestamp: Date.now() });

    // Limit cache size to 500 entries (simple LRU)
    if (ipfsCache.size > 500) {
      const firstKey = ipfsCache.keys().next().value;
      if (firstKey) ipfsCache.delete(firstKey);
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch IPFS metadata:', error);
    return null;
  }
}
