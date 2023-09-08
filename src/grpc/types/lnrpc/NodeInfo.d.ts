// Original file: proto/lightning.proto

import type {
  LightningNode as _lnrpc_LightningNode,
  LightningNode__Output as _lnrpc_LightningNode__Output,
} from '../lnrpc/LightningNode'
import type {
  ChannelEdge as _lnrpc_ChannelEdge,
  ChannelEdge__Output as _lnrpc_ChannelEdge__Output,
} from '../lnrpc/ChannelEdge'
import type { Long } from '@grpc/proto-loader'

export interface NodeInfo {
  node?: _lnrpc_LightningNode | null
  num_channels?: number
  total_capacity?: number | string | Long
  channels?: _lnrpc_ChannelEdge[]
}

export interface NodeInfo__Output {
  node: _lnrpc_LightningNode__Output | null
  num_channels: number
  total_capacity: string
  channels: _lnrpc_ChannelEdge__Output[]
}
