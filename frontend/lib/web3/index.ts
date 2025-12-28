/**
 * Web3 Interface - WEPIN Provider (VeryChain Mainnet)
 *
 * This is the STABLE API that all protocols use.
 * Using: WEPIN (the only auth layer supporting VeryChain mainnet)
 *
 * Usage in protocols:
 * ```typescript
 * import { useAccount, useWalletClient, usePublicClient, ConnectButton } from '@/lib/web3'
 *
 * function MyComponent() {
 *   const { address, isConnected } = useAccount()
 *   const walletClient = useWalletClient()
 *   const publicClient = usePublicClient()
 * }
 * ```
 */

// =============================================================================
// Re-export everything from the active provider
// =============================================================================

export {
  // Active provider indicator
  AUTH_PROVIDER,

  // Core Hooks
  useAccount,
  useIsSmartAccount,
  usePublicClient,
  useWalletClient,
  useChainId,
  useSwitchChain,
  useChains,
  useBalance,

  // Transaction Hooks
  useSendTransaction,
  useWaitForTransaction,
  useGasPrice,

  // Contract Hooks
  useReadContract,
  useWriteContract,

  // Connection Hooks
  useConnect,
  useDisconnect,

  // ENS Hooks
  useEnsName,
  useEnsAvatar,

  // Signature Hooks
  useSignMessage,
  useSignTypedData,

  // Components
  ConnectButton,

  // Provider Component
  Web3Provider,

  // WEPIN Widget SDK Exports
  useWepinWidget,
  useWepinStatus,
  useWepinWidgetControl,
  useWepinAccounts,
  useWepinNFTs,
  useWepinSend,
  useWepinReceive,
  useWepinUser,
  WepinWidgetContext,
} from './providers'

// WEPIN Widget Types
export type {
  WepinAccount,
  WepinBalance,
  WepinNFT,
  WepinUserInfo,
  WepinUserStatus,
  WepinUser,
  WepinLifecycle,
  WepinTxData,
  WepinSendResult,
  WepinWidgetContextValue,
} from './providers/wepin'

// =============================================================================
// Re-export types from the active provider
// =============================================================================

export type {
  // Account
  Web3Account,

  // Clients
  UsePublicClientReturn,
  UseWalletClientReturn,

  // Chain
  UseSwitchChainReturn,
  UseChainsReturn,

  // Balance
  UseBalanceParams,
  UseBalanceReturn,

  // Token
  Token,
  UseTokenParams,
  UseTokenReturn,

  // Transaction
  TransactionRequest,
  UseSendTransactionReturn,
  UseWaitForTransactionParams,
  UseWaitForTransactionReturn,

  // Contract
  UseReadContractParams,
  UseReadContractReturn,
  UseWriteContractReturn,

  // Connection
  UseConnectReturn,
  UseDisconnectReturn,

  // ENS
  UseEnsNameParams,
  UseEnsNameReturn,
  UseEnsAvatarParams,
  UseEnsAvatarReturn,

  // Signature
  UseSignMessageReturn,
  UseSignTypedDataReturn,
} from './providers'

// =============================================================================
// Re-export viem types (used by all providers)
// =============================================================================

export type {
  PublicClient,
  WalletClient,
  Chain,
  Address,
  Hash,
  Hex,
} from 'viem'

// =============================================================================
// Shared Utilities (not provider-specific)
// =============================================================================

// Common formatting utilities
export { formatAddress, formatBalance, formatUSD, formatTokenAmount, isValidAddress } from './format'

// Chain utilities
export { getChainById, getChainName, getExplorerLink, isTestnet, getExplorerUrl, getChainIcon } from '@/lib/config/chains'

// Asset utilities
export { getChainLogoUrl, getTokenLogoUrl, getChainMetadata, CHAIN_IDS, CHAIN_METADATA } from './assets'
