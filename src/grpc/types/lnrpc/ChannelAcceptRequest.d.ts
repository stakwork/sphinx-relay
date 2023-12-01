// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  CommitmentType as _lnrpc_CommitmentType,
  CommitmentType__Output as _lnrpc_CommitmentType__Output,
} from '../lnrpc/CommitmentType'

export interface ChannelAcceptRequest {
  node_pubkey?: Buffer | Uint8Array | string
  chain_hash?: Buffer | Uint8Array | string
  pending_chan_id?: Buffer | Uint8Array | string
  funding_amt?: number | string | Long
  push_amt?: number | string | Long
  dust_limit?: number | string | Long
  max_value_in_flight?: number | string | Long
  channel_reserve?: number | string | Long
  min_htlc?: number | string | Long
  fee_per_kw?: number | string | Long
  csv_delay?: number
  max_accepted_htlcs?: number
  channel_flags?: number
  commitment_type?: _lnrpc_CommitmentType
  wants_zero_conf?: boolean
  wants_scid_alias?: boolean
}

export interface ChannelAcceptRequest__Output {
  node_pubkey: Buffer
  chain_hash: Buffer
  pending_chan_id: Buffer
  funding_amt: string
  push_amt: string
  dust_limit: string
  max_value_in_flight: string
  channel_reserve: string
  min_htlc: string
  fee_per_kw: string
  csv_delay: number
  max_accepted_htlcs: number
  channel_flags: number
  commitment_type: _lnrpc_CommitmentType__Output
  wants_zero_conf: boolean
  wants_scid_alias: boolean
}
