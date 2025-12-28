/**
 * Connection Hooks - Wagmi Implementation
 */

'use client'

import { useConnect as useWagmiConnect, useDisconnect as useWagmiDisconnect } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import type { UseConnectReturn, UseDisconnectReturn } from '../wepin/types'

export function useConnect(): UseConnectReturn {
  const { openConnectModal } = useConnectModal()
  const { isPending, error } = useWagmiConnect()

  const connect = () => {
    openConnectModal?.()
  }

  return { connect, isPending, error: error || null }
}

export function useDisconnect(): UseDisconnectReturn {
  const { disconnect, isPending } = useWagmiDisconnect()

  return {
    disconnect: () => disconnect(),
    isPending,
  }
}
