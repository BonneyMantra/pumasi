/**
 * Balance Hook - Wagmi Implementation
 */

'use client'

import { useBalance as useWagmiBalance } from 'wagmi'
import { formatUnits } from 'viem'
import type { UseBalanceParams, UseBalanceReturn } from '../wepin/types'

export function useBalance(params: UseBalanceParams = {}): UseBalanceReturn {
  const { address, token, chainId } = params

  const { data, isLoading, isRefetching, error, refetch } = useWagmiBalance({
    address,
    token,
    chainId,
    query: { enabled: !!address },
  })

  return {
    balance: data?.value,
    formatted: data ? formatUnits(data.value, data.decimals) : undefined,
    symbol: data?.symbol,
    decimals: data?.decimals,
    isLoading,
    isRefetching,
    error: error || null,
    refetch,
  }
}
