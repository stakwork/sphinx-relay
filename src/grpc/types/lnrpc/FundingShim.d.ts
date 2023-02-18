// Original file: proto/lightning.proto

import type {
  ChanPointShim as _lnrpc_ChanPointShim,
  ChanPointShim__Output as _lnrpc_ChanPointShim__Output,
} from '../lnrpc/ChanPointShim'
import type {
  PsbtShim as _lnrpc_PsbtShim,
  PsbtShim__Output as _lnrpc_PsbtShim__Output,
} from '../lnrpc/PsbtShim'

export interface FundingShim {
  chan_point_shim?: _lnrpc_ChanPointShim | null
  psbt_shim?: _lnrpc_PsbtShim | null
  shim?: 'chan_point_shim' | 'psbt_shim'
}

export interface FundingShim__Output {
  chan_point_shim?: _lnrpc_ChanPointShim__Output | null
  psbt_shim?: _lnrpc_PsbtShim__Output | null
  shim: 'chan_point_shim' | 'psbt_shim'
}
