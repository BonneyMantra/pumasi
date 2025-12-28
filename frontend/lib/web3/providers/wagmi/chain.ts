/**
 * Chain Hooks - Wagmi Implementation
 */

'use client'

import { useChainId as useWagmiChainId, useSwitchChain as useWagmiSwitchChain, useChains as useWagmiChains } from 'wagmi'
import type { UseSwitchChainReturn, UseChainsReturn } from '../wepin/types'

export function useChainId(): number | undefined {
  return useWagmiChainId()
}

export function useSwitchChain(): UseSwitchChainReturn {
  const { switchChainAsync, isPending, error } = useWagmiSwitchChain()

  const switchChain = async (chainId: number) => {
    await switchChainAsync({ chainId })
  }

  return { switchChain, isPending, error: error || null }
}

export function useChains(): UseChainsReturn {
  const chains = useWagmiChains()
  return { chains }
}
