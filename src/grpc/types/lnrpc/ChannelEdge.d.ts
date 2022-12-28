// Original file: proto/lightning.proto

import type {
  RoutingPolicy as _lnrpc_RoutingPolicy,
  RoutingPolicy__Output as _lnrpc_RoutingPolicy__Output,
} from '../lnrpc/RoutingPolicy'
import type { Long } from '@grpc/proto-loader'

export interface ChannelEdge {
  channel_id?: number | string | Long
  chan_point?: string
  last_update?: number
  node1_pub?: string
  node2_pub?: string
  capacity?: number | string | Long
  node1_policy?: _lnrpc_RoutingPolicy | null
  node2_policy?: _lnrpc_RoutingPolicy | null
  custom_records?: { [key: number]: Buffer | Uint8Array | string }
}

export interface ChannelEdge__Output {
  channel_id: string
  chan_point: string
  last_update: number
  node1_pub: string
  node2_pub: string
  capacity: string
  node1_policy: _lnrpc_RoutingPolicy__Output | null
  node2_policy: _lnrpc_RoutingPolicy__Output | null
  custom_records: { [key: number]: Buffer }
}
