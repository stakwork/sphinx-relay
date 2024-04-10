// Original file: proto/rpc_proxy.proto

import type { Long } from '@grpc/proto-loader'
import type {
  RoutingPolicy as _lnrpc_proxy_RoutingPolicy,
  RoutingPolicy__Output as _lnrpc_proxy_RoutingPolicy__Output,
} from '../lnrpc_proxy/RoutingPolicy'

export interface ChannelEdge {
  channel_id?: number | string | Long
  chan_point?: string
  last_update?: number
  node1_pub?: string
  node2_pub?: string
  capacity?: number | string | Long
  node1_policy?: _lnrpc_proxy_RoutingPolicy | null
  node2_policy?: _lnrpc_proxy_RoutingPolicy | null
}

export interface ChannelEdge__Output {
  channel_id: string
  chan_point: string
  last_update: number
  node1_pub: string
  node2_pub: string
  capacity: string
  node1_policy: _lnrpc_proxy_RoutingPolicy__Output | null
  node2_policy: _lnrpc_proxy_RoutingPolicy__Output | null
}
