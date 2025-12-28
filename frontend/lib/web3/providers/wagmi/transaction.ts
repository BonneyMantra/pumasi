/**
 * Transaction Hooks - Wagmi Implementation
 */

'use client'

import { useState, useCallback } from 'react'
import { useSendTransaction as useWagmiSendTransaction, useWaitForTransactionReceipt, useGasPrice as useWagmiGasPrice } from 'wagmi'
import type { TransactionRequest, UseSendTransactionReturn, UseWaitForTransactionParams, UseWaitForTransactionReturn } from '../wepin/types'

export function useSendTransaction(): UseSendTransactionReturn {
  const { sendTransactionAsync, isPending, error } = useWagmiSendTransaction()

  const sendTransaction = useCallback(async (tx: TransactionRequest): Promise<`0x${string}`> => {
    const hash = await sendTransactionAsync({
      to: tx.to,
      data: tx.data,
      value: tx.value,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
    })
    return hash
  }, [sendTransactionAsync])

  return { sendTransaction, isPending, error: error || null }
}

export function useWaitForTransaction(params: UseWaitForTransactionParams): UseWaitForTransactionReturn {
  const { hash, confirmations = 1 } = params

  const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
    confirmations,
    query: { enabled: !!hash },
  })

  return { isLoading, isSuccess, isError, error: error || null }
}

export function useGasPrice(): { gasPrice: bigint | undefined; isLoading: boolean } {
  const { data: gasPrice, isLoading } = useWagmiGasPrice()
  return { gasPrice, isLoading }
}
