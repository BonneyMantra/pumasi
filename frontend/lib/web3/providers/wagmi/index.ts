/**
 * Wagmi Provider Exports
 * VeryChain Mainnet - WEPIN is the primary auth provider
 */

// Active provider indicator
export const AUTH_PROVIDER = 'wagmi' as const

// Core Hooks
export { useAccount, useIsSmartAccount } from './account'
export { usePublicClient, useWalletClient } from './clients'
export { useChainId, useSwitchChain, useChains } from './chain'
export { useBalance } from './balance'
export { useSendTransaction, useWaitForTransaction, useGasPrice } from './transaction'
export { useReadContract, useWriteContract } from './contract'
export { useConnect, useDisconnect } from './connection'
export { useEnsName, useEnsAvatar } from './ens'
export { useSignMessage, useSignTypedData } from './signature'

// Components
export { ConnectButton } from './connect-button'

// Provider
export { Web3Provider } from './web3-provider'

// Config
export { wagmiConfig } from './config'

// Re-export types from wepin (same interface)
export type {
  Web3Account,
  UsePublicClientReturn,
  UseWalletClientReturn,
  UseSwitchChainReturn,
  UseChainsReturn,
  UseBalanceParams,
  UseBalanceReturn,
  Token,
  UseTokenParams,
  UseTokenReturn,
  TransactionRequest,
  UseSendTransactionReturn,
  UseWaitForTransactionParams,
  UseWaitForTransactionReturn,
  UseReadContractParams,
  UseReadContractReturn,
  UseWriteContractReturn,
  UseConnectReturn,
  UseDisconnectReturn,
  UseEnsNameParams,
  UseEnsNameReturn,
  UseEnsAvatarParams,
  UseEnsAvatarReturn,
  UseSignMessageReturn,
  UseSignTypedDataReturn,
} from '../wepin/types'
