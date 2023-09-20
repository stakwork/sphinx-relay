// Original file: proto/lightning.proto

import type {
  Initiator as _lnrpc_Initiator,
  Initiator__Output as _lnrpc_Initiator__Output,
} from '../lnrpc/Initiator'
import type {
  CommitmentType as _lnrpc_CommitmentType,
  CommitmentType__Output as _lnrpc_CommitmentType__Output,
} from '../lnrpc/CommitmentType'
import type {
  PendingHTLC as _lnrpc_PendingHTLC,
  PendingHTLC__Output as _lnrpc_PendingHTLC__Output,
} from '../lnrpc/PendingHTLC'
import type { Long } from '@grpc/proto-loader'

// Original file: proto/lightning.proto

export const _lnrpc_PendingChannelsResponse_ForceClosedChannel_AnchorState = {
  LIMBO: 'LIMBO',
  RECOVERED: 'RECOVERED',
  LOST: 'LOST',
} as const

export type _lnrpc_PendingChannelsResponse_ForceClosedChannel_AnchorState =
  | 'LIMBO'
  | 0
  | 'RECOVERED'
  | 1
  | 'LOST'
  | 2

export type _lnrpc_PendingChannelsResponse_ForceClosedChannel_AnchorState__Output =
  (typeof _lnrpc_PendingChannelsResponse_ForceClosedChannel_AnchorState)[keyof typeof _lnrpc_PendingChannelsResponse_ForceClosedChannel_AnchorState]

export interface _lnrpc_PendingChannelsResponse_ClosedChannel {
  channel?: _lnrpc_PendingChannelsResponse_PendingChannel | null
  closing_txid?: string
}

export interface _lnrpc_PendingChannelsResponse_ClosedChannel__Output {
  channel: _lnrpc_PendingChannelsResponse_PendingChannel__Output | null
  closing_txid: string
}

export interface _lnrpc_PendingChannelsResponse_Commitments {
  local_txid?: string
  remote_txid?: string
  remote_pending_txid?: string
  local_commit_fee_sat?: number | string | Long
  remote_commit_fee_sat?: number | string | Long
  remote_pending_commit_fee_sat?: number | string | Long
}

export interface _lnrpc_PendingChannelsResponse_Commitments__Output {
  local_txid: string
  remote_txid: string
  remote_pending_txid: string
  local_commit_fee_sat: string
  remote_commit_fee_sat: string
  remote_pending_commit_fee_sat: string
}

export interface _lnrpc_PendingChannelsResponse_ForceClosedChannel {
  channel?: _lnrpc_PendingChannelsResponse_PendingChannel | null
  closing_txid?: string
  limbo_balance?: number | string | Long
  maturity_height?: number
  blocks_til_maturity?: number
  recovered_balance?: number | string | Long
  pending_htlcs?: _lnrpc_PendingHTLC[]
  anchor?: _lnrpc_PendingChannelsResponse_ForceClosedChannel_AnchorState
}

export interface _lnrpc_PendingChannelsResponse_ForceClosedChannel__Output {
  channel: _lnrpc_PendingChannelsResponse_PendingChannel__Output | null
  closing_txid: string
  limbo_balance: string
  maturity_height: number
  blocks_til_maturity: number
  recovered_balance: string
  pending_htlcs: _lnrpc_PendingHTLC__Output[]
  anchor: _lnrpc_PendingChannelsResponse_ForceClosedChannel_AnchorState__Output
}

export interface _lnrpc_PendingChannelsResponse_PendingChannel {
  remote_node_pub?: string
  channel_point?: string
  capacity?: number | string | Long
  local_balance?: number | string | Long
  remote_balance?: number | string | Long
  local_chan_reserve_sat?: number | string | Long
  remote_chan_reserve_sat?: number | string | Long
  initiator?: _lnrpc_Initiator
  commitment_type?: _lnrpc_CommitmentType
  num_forwarding_packages?: number | string | Long
  chan_status_flags?: string
  private?: boolean
}

export interface _lnrpc_PendingChannelsResponse_PendingChannel__Output {
  remote_node_pub: string
  channel_point: string
  capacity: string
  local_balance: string
  remote_balance: string
  local_chan_reserve_sat: string
  remote_chan_reserve_sat: string
  initiator: _lnrpc_Initiator__Output
  commitment_type: _lnrpc_CommitmentType__Output
  num_forwarding_packages: string
  chan_status_flags: string
  private: boolean
}

export interface _lnrpc_PendingChannelsResponse_PendingOpenChannel {
  channel?: _lnrpc_PendingChannelsResponse_PendingChannel | null
  commit_fee?: number | string | Long
  commit_weight?: number | string | Long
  fee_per_kw?: number | string | Long
}

export interface _lnrpc_PendingChannelsResponse_PendingOpenChannel__Output {
  channel: _lnrpc_PendingChannelsResponse_PendingChannel__Output | null
  commit_fee: string
  commit_weight: string
  fee_per_kw: string
}

export interface _lnrpc_PendingChannelsResponse_WaitingCloseChannel {
  channel?: _lnrpc_PendingChannelsResponse_PendingChannel | null
  limbo_balance?: number | string | Long
  commitments?: _lnrpc_PendingChannelsResponse_Commitments | null
  closing_txid?: string
}

export interface _lnrpc_PendingChannelsResponse_WaitingCloseChannel__Output {
  channel: _lnrpc_PendingChannelsResponse_PendingChannel__Output | null
  limbo_balance: string
  commitments: _lnrpc_PendingChannelsResponse_Commitments__Output | null
  closing_txid: string
}

export interface PendingChannelsResponse {
  total_limbo_balance?: number | string | Long
  pending_open_channels?: _lnrpc_PendingChannelsResponse_PendingOpenChannel[]
  pending_closing_channels?: _lnrpc_PendingChannelsResponse_ClosedChannel[]
  pending_force_closing_channels?: _lnrpc_PendingChannelsResponse_ForceClosedChannel[]
  waiting_close_channels?: _lnrpc_PendingChannelsResponse_WaitingCloseChannel[]
}

export interface PendingChannelsResponse__Output {
  total_limbo_balance: string
  pending_open_channels: _lnrpc_PendingChannelsResponse_PendingOpenChannel__Output[]
  pending_closing_channels: _lnrpc_PendingChannelsResponse_ClosedChannel__Output[]
  pending_force_closing_channels: _lnrpc_PendingChannelsResponse_ForceClosedChannel__Output[]
  waiting_close_channels: _lnrpc_PendingChannelsResponse_WaitingCloseChannel__Output[]
}
