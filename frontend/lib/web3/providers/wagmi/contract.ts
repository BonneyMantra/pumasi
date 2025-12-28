/**
 * Contract Hooks - Wagmi Implementation
 */

'use client'

import { useCallback } from 'react'
import { useReadContract as useWagmiReadContract, useWriteContract as useWagmiWriteContract } from 'wagmi'
import type { UseReadContractParams, UseReadContractReturn, UseWriteContractReturn, Address } from '../wepin/types'
import type { Abi } from 'viem'

export function useReadContract<T = unknown>(params: UseReadContractParams): UseReadContractReturn<T> {
  const { address, abi, functionName, args, chainId } = params

  const { data, isLoading, isRefetching, error, refetch } = useWagmiReadContract({
    address,
    abi: abi as Abi,
    functionName,
    args: args as readonly unknown[],
    chainId,
    query: { enabled: !!address },
  })

  return {
    data: data as T | undefined,
    isLoading,
    isRefetching,
    error: error || null,
    refetch,
  }
}

export function useWriteContract(): UseWriteContractReturn {
  const { writeContractAsync, isPending, error } = useWagmiWriteContract()

  const writeContract = useCallback(async (params: {
    address: Address
    abi: readonly unknown[]
    functionName: string
    args?: readonly unknown[]
    value?: bigint
  }): Promise<`0x${string}`> => {
    const hash = await writeContractAsync({
      address: params.address,
      abi: params.abi as Abi,
      functionName: params.functionName,
      args: params.args as readonly unknown[],
      value: params.value,
    })
    return hash
  }, [writeContractAsync])

  return { writeContract, isPending, error: error || null }
}
