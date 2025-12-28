import type { Address } from 'viem'

import { VERYCHAIN_CHAIN_ID } from '@/constants/chains/verychain'

/**
 * Contract Addresses - VeryChain Mainnet (Chain ID: 74)
 *
 * IMPORTANT: Update these addresses after deploying contracts to VeryChain mainnet.
 */
export const ADDRESSES: Record<number, {
  erc20: Record<string, Address>
  erc721: Record<string, Address>
  other: Record<string, Address>
  pumasi: Record<string, Address>
}> = {
  // VeryChain Mainnet (Chain ID: 74)
  [VERYCHAIN_CHAIN_ID]: {
    erc20: {},
    erc721: {},
    other: {},
    pumasi: {
      JobFactory: '0x0000000000000000000000000000000000000000',
      ApplicationRegistry: '0x0000000000000000000000000000000000000000',
      MilestoneManager: '0x0000000000000000000000000000000000000000',
      ReviewRegistry: '0x0000000000000000000000000000000000000000',
      ArbitrationDAO: '0x0000000000000000000000000000000000000000',
      ProfileRegistry: '0x0000000000000000000000000000000000000000',
    },
  },
} as const

// Helper function to get contract address by type and name
export function getContractAddress(chainId: number, type: 'erc20' | 'erc721' | 'other' | 'pumasi', contractName: string): Address | undefined {
  return ADDRESSES[chainId]?.[type]?.[contractName]
}

// Helper function to get Pumasi contract addresses
export function getPumasiContracts(chainId: number): Record<string, Address> {
  return ADDRESSES[chainId]?.pumasi || {}
}

// Helper function to get a specific Pumasi contract address
export function getPumasiContractAddress(chainId: number, contractName: string): Address | undefined {
  return ADDRESSES[chainId]?.pumasi?.[contractName]
}

// Helper function to get all ERC20 tokens for a chain
export function getERC20Tokens(chainId: number): Record<string, Address> {
  return ADDRESSES[chainId]?.erc20 || {}
}

// Helper function to get all ERC721 collections for a chain
export function getERC721Collections(chainId: number): Record<string, Address> {
  return ADDRESSES[chainId]?.erc721 || {}
}

// Helper function to get all other contracts for a chain
export function getOtherContracts(chainId: number): Record<string, Address> {
  return ADDRESSES[chainId]?.other || {}
}

// Helper function to get all addresses for a chain (legacy support)
export function getChainAddresses(chainId: number): { erc20: Record<string, Address>, erc721: Record<string, Address>, other: Record<string, Address> } | undefined {
  return ADDRESSES[chainId]
}

// Helper function to check if contract is deployed on chain
export function isContractDeployed(chainId: number, type: 'erc20' | 'erc721' | 'other', contractName: string): boolean {
  const address = getContractAddress(chainId, type, contractName)
  return address !== undefined && address !== '0x0000000000000000000000000000000000000000'
}