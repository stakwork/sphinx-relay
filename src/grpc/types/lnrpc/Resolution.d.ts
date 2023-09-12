// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  ResolutionType as _lnrpc_ResolutionType,
  ResolutionType__Output as _lnrpc_ResolutionType__Output,
} from '../lnrpc/ResolutionType'
import type {
  ResolutionOutcome as _lnrpc_ResolutionOutcome,
  ResolutionOutcome__Output as _lnrpc_ResolutionOutcome__Output,
} from '../lnrpc/ResolutionOutcome'
import type {
  OutPoint as _lnrpc_OutPoint,
  OutPoint__Output as _lnrpc_OutPoint__Output,
} from '../lnrpc/OutPoint'

export interface Resolution {
  resolution_type?: _lnrpc_ResolutionType
  outcome?: _lnrpc_ResolutionOutcome
  outpoint?: _lnrpc_OutPoint | null
  amount_sat?: number | string | Long
  sweep_txid?: string
}

export interface Resolution__Output {
  resolution_type: _lnrpc_ResolutionType__Output
  outcome: _lnrpc_ResolutionOutcome__Output
  outpoint: _lnrpc_OutPoint__Output | null
  amount_sat: string
  sweep_txid: string
}
