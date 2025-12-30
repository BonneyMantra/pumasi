/**
 * Block Explorer URL utilities - VeryChain Mainnet
 */

import { VERYCHAIN_CHAIN_ID } from '@/constants/chains/verychain'

const EXPLORER_URLS: Record<number, string> = {
  // VeryChain Mainnet
  [VERYCHAIN_CHAIN_ID]: 'https://www.veryscan.io',
};

/**
 * Get block explorer URL for a transaction
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const baseUrl = EXPLORER_URLS[chainId] || 'https://www.veryscan.io';
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const baseUrl = EXPLORER_URLS[chainId] || 'https://www.veryscan.io';
  return `${baseUrl}/address/${address}`;
}
