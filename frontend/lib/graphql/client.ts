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
const IPFS_FETCH_TIMEOUT = 8000; // 8 seconds timeout

/**
 * Get Pinata dedicated gateway URL
 *
 * Note: For restricted gateways, configure Host Origin in Pinata dashboard:
 * - Add localhost:3000, localhost:3005 for dev
 * - Add your production domain for prod
 * This is more secure than exposing a gateway key client-side.
 */
function getPinataGatewayUrl(cid: string): string | null {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
  if (!gateway) return null;

  const normalized = gateway.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return `https://${normalized}/ipfs/${cid}`;
}

/**
 * Get fallback IPFS gateways (public, no auth needed)
 */
function getFallbackGateways(): string[] {
  return [
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.io/ipfs/',
  ];
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch IPFS metadata and parse as JSON (with caching and gateway fallback)
 */
export async function fetchIPFSMetadata<T>(ipfsUri: string): Promise<T | null> {
  if (!ipfsUri) return null;

  // Check cache first
  const cached = ipfsCache.get(ipfsUri);
  if (cached && Date.now() - cached.timestamp < IPFS_CACHE_TTL) {
    return cached.data as T;
  }

  // Extract CID from ipfs:// URI
  const cid = ipfsUri.startsWith('ipfs://') ? ipfsUri.slice(7) : ipfsUri;

  // Priority 1: Try user's Pinata dedicated gateway (fastest for their CIDs)
  const pinataUrl = getPinataGatewayUrl(cid);
  if (pinataUrl) {
    try {
      console.log('[IPFS] Trying Pinata dedicated gateway:', pinataUrl.split('?')[0]);
      const response = await fetchWithTimeout(pinataUrl, IPFS_FETCH_TIMEOUT);
      if (response.ok) {
        const data = await response.json();
        console.log('[IPFS] Success from Pinata dedicated gateway');
        ipfsCache.set(ipfsUri, { data, timestamp: Date.now() });
        return data;
      }
      console.warn('[IPFS] Pinata gateway returned:', response.status);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn('[IPFS] Pinata gateway failed:', errorMsg);
    }
  }

  // Priority 2+: Try fallback public gateways
  const fallbackGateways = getFallbackGateways();
  for (const gateway of fallbackGateways) {
    try {
      const url = `${gateway}${cid}`;
      console.log('[IPFS] Trying fallback:', url);

      const response = await fetchWithTimeout(url, IPFS_FETCH_TIMEOUT);
      if (!response.ok) {
        console.warn(`[IPFS] Gateway ${gateway} returned ${response.status}`);
        continue;
      }

      const data = await response.json();
      console.log('[IPFS] Success from:', gateway);

      // Cache the result
      ipfsCache.set(ipfsUri, { data, timestamp: Date.now() });

      // Limit cache size to 500 entries (simple LRU)
      if (ipfsCache.size > 500) {
        const firstKey = ipfsCache.keys().next().value;
        if (firstKey) ipfsCache.delete(firstKey);
      }

      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[IPFS] Gateway ${gateway} failed:`, errorMsg);
      continue;
    }
  }

  console.error('[IPFS] All gateways failed for:', ipfsUri);
  return null;
}
