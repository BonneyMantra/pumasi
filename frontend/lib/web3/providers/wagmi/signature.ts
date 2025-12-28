/**
 * Signature Hooks - Wagmi Implementation
 */

'use client'

import { useCallback } from 'react'
import { useSignMessage as useWagmiSignMessage, useSignTypedData as useWagmiSignTypedData } from 'wagmi'
import type { UseSignMessageReturn, UseSignTypedDataReturn } from '../wepin/types'

export function useSignMessage(): UseSignMessageReturn {
  const { signMessageAsync, isPending, error } = useWagmiSignMessage()

  const signMessage = useCallback(async (message: string): Promise<`0x${string}`> => {
    return signMessageAsync({ message })
  }, [signMessageAsync])

  return { signMessage, isPending, error: error || null }
}

export function useSignTypedData(): UseSignTypedDataReturn {
  const { signTypedDataAsync, isPending, error } = useWagmiSignTypedData()

  const signTypedData = useCallback(async (typedData: unknown): Promise<`0x${string}`> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return signTypedDataAsync(typedData as any)
  }, [signTypedDataAsync])

  return { signTypedData, isPending, error: error || null }
}
