/**
 * ENS Hooks - Wagmi Implementation
 */

'use client'

import { useEnsName as useWagmiEnsName, useEnsAvatar as useWagmiEnsAvatar } from 'wagmi'
import type { UseEnsNameParams, UseEnsNameReturn, UseEnsAvatarParams, UseEnsAvatarReturn } from '../wepin/types'

export function useEnsName(params: UseEnsNameParams): UseEnsNameReturn {
  const { address, chainId } = params

  const { data: ensName, isLoading, error } = useWagmiEnsName({
    address,
    chainId: chainId || 1, // ENS only on mainnet
    query: { enabled: !!address },
  })

  return { ensName, isLoading, error: error || null }
}

export function useEnsAvatar(params: UseEnsAvatarParams): UseEnsAvatarReturn {
  const { name, chainId } = params

  const { data: ensAvatar, isLoading, error } = useWagmiEnsAvatar({
    name: name || undefined,
    chainId: chainId || 1,
    query: { enabled: !!name },
  })

  return { ensAvatar, isLoading, error: error || null }
}
