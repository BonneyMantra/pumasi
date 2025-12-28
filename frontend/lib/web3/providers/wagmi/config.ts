/**
 * Wagmi Configuration
 * VeryChain Mainnet only - WEPIN is the primary auth provider
 */

import { http } from 'wagmi'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { verychain } from '@/constants/chains/verychain'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

export const wagmiConfig = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Pumasi',
  projectId,
  chains: [verychain],
  transports: {
    [verychain.id]: http(),
  },
  ssr: true,
})

export { verychain }
