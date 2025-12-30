/**
 * Pumasi Contract Addresses
 * VeryChain Mainnet only (Chain ID: 74)
 *
 * IMPORTANT: Update these addresses after deploying contracts.
 */

import { VERYCHAIN_CHAIN_ID } from '@/constants/chains/verychain'

export const PUMASI_CONTRACTS = {
  verychain: {
    JobFactory: '0x0000000000000000000000000000000000000000',
    ApplicationRegistry: '0x0000000000000000000000000000000000000000',
    MilestoneManager: '0x0000000000000000000000000000000000000000',
    ReviewRegistry: '0x0000000000000000000000000000000000000000',
    ArbitrationDAO: '0x0000000000000000000000000000000000000000',
    ProfileRegistry: '0x0000000000000000000000000000000000000000',
  },
} as const;

export type ContractName = keyof (typeof PUMASI_CONTRACTS)['verychain'];
export type NetworkName = keyof typeof PUMASI_CONTRACTS;

/**
 * Get contract address for VeryChain mainnet
 */
export function getContractAddress(
  contract: ContractName,
  network: NetworkName = 'verychain'
): `0x${string}` {
  const address = PUMASI_CONTRACTS[network][contract];
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`Contract ${contract} not deployed on ${network}`);
  }
  return address as `0x${string}`;
}

/**
 * Check if contracts are deployed on VeryChain
 */
export function isNetworkSupported(network: NetworkName): boolean {
  const contracts = PUMASI_CONTRACTS[network];
  return Object.values(contracts).every(
    (addr) => addr !== '0x0000000000000000000000000000000000000000'
  );
}

/**
 * Get the VeryChain chain ID
 */
export function getVeryChainId(): number {
  return VERYCHAIN_CHAIN_ID;
}
