// Original file: proto/lightning.proto

import type {
  Initiator as _lnrpc_Initiator,
  Initiator__Output as _lnrpc_Initiator__Output,
} from '../lnrpc/Initiator'
import type {
  Resolution as _lnrpc_Resolution,
  Resolution__Output as _lnrpc_Resolution__Output,
} from '../lnrpc/Resolution'
import type { Long } from '@grpc/proto-loader'

// Original file: proto/lightning.proto

export const _lnrpc_ChannelCloseSummary_ClosureType = {
  COOPERATIVE_CLOSE: 'COOPERATIVE_CLOSE',
  LOCAL_FORCE_CLOSE: 'LOCAL_FORCE_CLOSE',
  REMOTE_FORCE_CLOSE: 'REMOTE_FORCE_CLOSE',
  BREACH_CLOSE: 'BREACH_CLOSE',
  FUNDING_CANCELED: 'FUNDING_CANCELED',
  ABANDONED: 'ABANDONED',
} as const

export type _lnrpc_ChannelCloseSummary_ClosureType =
  | 'COOPERATIVE_CLOSE'
  | 0
  | 'LOCAL_FORCE_CLOSE'
  | 1
  | 'REMOTE_FORCE_CLOSE'
  | 2
  | 'BREACH_CLOSE'
  | 3
  | 'FUNDING_CANCELED'
  | 4
  | 'ABANDONED'
  | 5

export type _lnrpc_ChannelCloseSummary_ClosureType__Output =
  (typeof _lnrpc_ChannelCloseSummary_ClosureType)[keyof typeof _lnrpc_ChannelCloseSummary_ClosureType]

export interface ChannelCloseSummary {
  channel_point?: string
  chan_id?: number | string | Long
  chain_hash?: string
  closing_tx_hash?: string
  remote_pubkey?: string
  capacity?: number | string | Long
  close_height?: number
  settled_balance?: number | string | Long
  time_locked_balance?: number | string | Long
  close_type?: _lnrpc_ChannelCloseSummary_ClosureType
  open_initiator?: _lnrpc_Initiator
  close_initiator?: _lnrpc_Initiator
  resolutions?: _lnrpc_Resolution[]
  alias_scids?: (number | string | Long)[]
  zero_conf_confirmed_scid?: number | string | Long
}

export interface ChannelCloseSummary__Output {
  channel_point: string
  chan_id: string
  chain_hash: string
  closing_tx_hash: string
  remote_pubkey: string
  capacity: string
  close_height: number
  settled_balance: string
  time_locked_balance: string
  close_type: _lnrpc_ChannelCloseSummary_ClosureType__Output
  open_initiator: _lnrpc_Initiator__Output
  close_initiator: _lnrpc_Initiator__Output
  resolutions: _lnrpc_Resolution__Output[]
  alias_scids: string[]
  zero_conf_confirmed_scid: string
}
