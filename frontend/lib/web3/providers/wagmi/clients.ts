/**
 * Client Hooks - Wagmi Implementation
 */

'use client'

import { usePublicClient as useWagmiPublicClient, useWalletClient as useWagmiWalletClient } from 'wagmi'
import type { UsePublicClientReturn, UseWalletClientReturn } from '../wepin/types'

export function usePublicClient(): UsePublicClientReturn {
  const publicClient = useWagmiPublicClient()
  return { publicClient }
}

export function useWalletClient(): UseWalletClientReturn {
  const { data: walletClient, isLoading } = useWagmiWalletClient()
  return { walletClient, isLoading }
}
