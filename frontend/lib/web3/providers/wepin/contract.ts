/**
 * Contract Hooks - WEPIN Implementation
 *
 * Provides contract read/write functionality using viem and WEPIN.
 */

'use client'

import { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { createPublicClient, http, encodeFunctionData, toHex, hexToBigInt } from 'viem'
import { useWepinContext } from './wepin-client'
import { getChainById } from '@/lib/config/chains'
import type {
  UseReadContractParams,
  UseReadContractReturn,
  UseWriteContractReturn,
  Address,
} from './types'

type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

/**
 * Hook to read from a contract
 */
export function useReadContract<T = unknown>(params: UseReadContractParams): UseReadContractReturn<T> {
  const { address, abi, functionName, args, chainId: paramChainId, watch = false } = params
  const { chainId: currentChainId } = useWepinContext()

  const [data, setData] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const targetChainId = paramChainId || currentChainId

  // Stabilize args and abi to prevent infinite loops
  const argsKey = useMemo(() => JSON.stringify(args), [args])
  const abiKey = useMemo(() => JSON.stringify(abi), [abi])
  const argsRef = useRef(args)
  const abiRef = useRef(abi)

  // Update refs when keys change
  useEffect(() => {
    argsRef.current = args
  }, [argsKey])

  useEffect(() => {
    abiRef.current = abi
  }, [abiKey])

  const fetchData = useCallback(async () => {
    if (!targetChainId) {
      setError(new Error('No chain ID available'))
      return
    }

    const chainConfig = getChainById(targetChainId)
    if (!chainConfig?.rpcUrl) {
      setError(new Error(`No RPC URL configured for chain ${targetChainId}`))
      return
    }

    const client = createPublicClient({
      chain: {
        id: targetChainId,
        name: chainConfig.name,
        nativeCurrency: chainConfig.chain.nativeCurrency,
        rpcUrls: { default: { http: [chainConfig.rpcUrl] } },
      },
      transport: http(chainConfig.rpcUrl),
    })

    try {
      const result = await client.readContract({
        address,
        abi: abiRef.current as readonly unknown[],
        functionName,
        args: argsRef.current as readonly unknown[],
      })
      setData(result as T)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to read contract'))
    }
  }, [address, abiKey, functionName, argsKey, targetChainId])

  // Initial fetch
  useEffect(() => {
    setIsLoading(true)
    fetchData().finally(() => setIsLoading(false))
  }, [fetchData])

  // Watch interval
  useEffect(() => {
    if (!watch) return

    const interval = setInterval(() => {
      setIsRefetching(true)
      fetchData().finally(() => setIsRefetching(false))
    }, 10000)

    return () => clearInterval(interval)
  }, [watch, fetchData])

  // Refetch trigger
  useEffect(() => {
    if (refetchTrigger > 0) {
      setIsRefetching(true)
      fetchData().finally(() => setIsRefetching(false))
    }
  }, [refetchTrigger, fetchData])

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1)
  }, [])

  return { data, isLoading, isRefetching, error, refetch }
}

/**
 * Hook to write to a contract
 */
export function useWriteContract(): UseWriteContractReturn {
  const { networkProvider, address: connectedAddress, chainId, isConnected } = useWepinContext()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const writeContract = useCallback(
    async (params: {
      address: Address
      abi: readonly unknown[]
      functionName: string
      args?: readonly unknown[]
      value?: bigint
    }): Promise<`0x${string}`> => {
      if (!networkProvider || !connectedAddress || !isConnected || !chainId) {
        throw new Error('Wallet not connected')
      }

      setIsPending(true)
      setError(null)

      try {
        const provider = networkProvider as EIP1193Provider

        // Encode the function data
        const data = encodeFunctionData({
          abi: params.abi as readonly unknown[],
          functionName: params.functionName,
          args: params.args as readonly unknown[],
        })

        // Estimate gas to avoid wallet over-estimation
        const estimateTxParams = {
          from: connectedAddress,
          to: params.address,
          data,
          value: params.value ? toHex(params.value) : undefined,
        }

        let gasLimit: bigint
        try {
          const estimatedGas = await provider.request({
            method: 'eth_estimateGas',
            params: [estimateTxParams],
          })
          // Add 20% buffer to estimated gas
          gasLimit = (hexToBigInt(estimatedGas as `0x${string}`) * 120n) / 100n
          console.log('[writeContract] Estimated gas:', estimatedGas, '-> with buffer:', gasLimit.toString())
        } catch (estimateErr) {
          console.warn('[writeContract] Gas estimation failed, using default:', estimateErr)
          gasLimit = 300000n // Fallback for simple contract calls
        }

        // Prepare transaction with gas limit
        const txParams = {
          ...estimateTxParams,
          gas: toHex(gasLimit),
        }

        const hash = await provider.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        })

        return hash as `0x${string}`
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Contract write failed')
        setError(error)
        throw error
      } finally {
        setIsPending(false)
      }
    },
    [networkProvider, connectedAddress, isConnected, chainId]
  )

  return { writeContract, isPending, error }
}
