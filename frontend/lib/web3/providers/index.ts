/**
 * Auth Provider - WEPIN
 *
 * WEPIN is the only auth layer that supports VeryChain mainnet.
 * This app is configured for VeryChain mainnet only.
 */

// =============================================================================
// PROVIDER: WEPIN (VeryChain mainnet)
// =============================================================================

export * from './wepin'

// Types from wepin (shared interface)
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
} from './wepin/types'
