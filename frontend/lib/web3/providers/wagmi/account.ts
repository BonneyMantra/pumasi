/**
 * Account Hooks - Wagmi Implementation
 */

'use client'

import { useAccount as useWagmiAccount } from 'wagmi'
import type { Web3Account } from '../wepin/types'

export function useAccount(): Web3Account {
  const { address, isConnected, isConnecting, isDisconnected, chain, connector } = useWagmiAccount()

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chain,
    chainId: chain?.id,
    isSmartAccount: false,
    walletId: connector?.id,
  }
}

export function useIsSmartAccount(): boolean {
  return false
}
