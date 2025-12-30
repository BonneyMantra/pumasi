/**
 * Contract Addresses - VeryChain Mainnet (Chain ID: 4613)
 *
 * Deployed: 2026-01-03
 * Deployer: 0x32FE11d9900D63350016374BE98ff37c3Af75847
 * Deploy using: forge script script/DeployPumasi.s.sol --rpc-url https://rpc.verylabs.io --broadcast
 */

import { VERYCHAIN_CHAIN_ID } from '@/constants/chains/verychain';

export const CONTRACT_ADDRESSES = {
  // VeryChain Mainnet (Chain ID: 4613)
  [VERYCHAIN_CHAIN_ID]: {
    jobFactory: '0x4aafcb744e5a9923640838c4788455b2cc1ebd48' as `0x${string}`,
    applicationRegistry: '0x625ab5ca543cde5dea9f9f53137162b30ce39af5' as `0x${string}`,
    milestoneManager: '0xb7f3d139128d54e6f994bcf0de88d5da8d1c71d2' as `0x${string}`,
    reviewRegistry: '0x2927b1f7c76aa9302621fc3dee30b024ab11d677' as `0x${string}`,
    arbitrationDAO: '0xa846e4d57cdb3077ed67e5d792949f7a6ef2a75d' as `0x${string}`,
    profileRegistry: '0x0c3ff18373d7683b34df2ef956f0e2205d232cc2' as `0x${string}`,
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;

export function getContractAddress(
  chainId: number,
  contract: keyof (typeof CONTRACT_ADDRESSES)[typeof VERYCHAIN_CHAIN_ID]
): `0x${string}` | undefined {
  const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId];
  return addresses?.[contract];
}

export function getJobFactoryAddress(chainId: number): `0x${string}` | undefined {
  return getContractAddress(chainId, 'jobFactory');
}
