// Original file: proto/lightning.proto

import type {
  FundingShim as _lnrpc_FundingShim,
  FundingShim__Output as _lnrpc_FundingShim__Output,
} from '../lnrpc/FundingShim'
import type {
  FundingShimCancel as _lnrpc_FundingShimCancel,
  FundingShimCancel__Output as _lnrpc_FundingShimCancel__Output,
} from '../lnrpc/FundingShimCancel'
import type {
  FundingPsbtVerify as _lnrpc_FundingPsbtVerify,
  FundingPsbtVerify__Output as _lnrpc_FundingPsbtVerify__Output,
} from '../lnrpc/FundingPsbtVerify'
import type {
  FundingPsbtFinalize as _lnrpc_FundingPsbtFinalize,
  FundingPsbtFinalize__Output as _lnrpc_FundingPsbtFinalize__Output,
} from '../lnrpc/FundingPsbtFinalize'

export interface FundingTransitionMsg {
  shim_register?: _lnrpc_FundingShim | null
  shim_cancel?: _lnrpc_FundingShimCancel | null
  psbt_verify?: _lnrpc_FundingPsbtVerify | null
  psbt_finalize?: _lnrpc_FundingPsbtFinalize | null
  trigger?: 'shim_register' | 'shim_cancel' | 'psbt_verify' | 'psbt_finalize'
}

export interface FundingTransitionMsg__Output {
  shim_register?: _lnrpc_FundingShim__Output | null
  shim_cancel?: _lnrpc_FundingShimCancel__Output | null
  psbt_verify?: _lnrpc_FundingPsbtVerify__Output | null
  psbt_finalize?: _lnrpc_FundingPsbtFinalize__Output | null
  trigger: 'shim_register' | 'shim_cancel' | 'psbt_verify' | 'psbt_finalize'
}
