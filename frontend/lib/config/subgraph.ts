/**
 * Subgraph Configuration - VeryChain Mainnet
 * Endpoints for Pumasi and Shinroe subgraphs
 *
 * REQUIRES: NEXT_PUBLIC_INDEXER_URL environment variable
 * Example: https://indexer.verychain.io/ (base domain only)
 * Constructs: <base>/subgraphs/name/<subgraph-name>
 */

import { VERYCHAIN_CHAIN_ID } from '@/constants/chains/verychain';

// Get the base indexer URL from environment (required)
function getIndexerUrl(): string {
  const url = process.env.NEXT_PUBLIC_INDEXER_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_INDEXER_URL is required but not configured');
  }
  // Remove trailing slash if present for consistent path building
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

// Build subgraph endpoint: <base>/subgraphs/name/<subgraph-name>
function buildSubgraphUrl(subgraphName: string): string {
  return `${getIndexerUrl()}/subgraphs/name/${subgraphName}`;
}

// Chain-specific subgraph names (VeryChain mainnet only)
const PUMASI_SUBGRAPH_NAMES: Record<number, string> = {
  [VERYCHAIN_CHAIN_ID]: 'pumasi', // VeryChain Mainnet
};

// Get Pumasi subgraph URL for a specific chain
export function getPumasiSubgraphUrl(chainId?: number): string {
  const subgraphName = chainId && PUMASI_SUBGRAPH_NAMES[chainId]
    ? PUMASI_SUBGRAPH_NAMES[chainId]
    : 'pumasi'; // Default to VeryChain mainnet
  return buildSubgraphUrl(subgraphName);
}

// Default Pumasi subgraph endpoint (VeryChain Mainnet)
export const PUMASI_SUBGRAPH_URL = buildSubgraphUrl('pumasi');

// Shinroe subgraph endpoint (for reputation scores)
export const SHINROE_SUBGRAPH_URL = buildSubgraphUrl('shinroe');

// Subgraph configuration object
export const SUBGRAPH_CONFIG = {
  pumasi: {
    name: 'Pumasi',
    url: PUMASI_SUBGRAPH_URL,
    description: 'Pumasi freelance marketplace indexer (VeryChain)',
  },
  shinroe: {
    name: 'Shinroe',
    url: SHINROE_SUBGRAPH_URL,
    description: 'Shinroe reputation system indexer (VeryChain)',
  },
} as const;

export type SubgraphName = keyof typeof SUBGRAPH_CONFIG;
