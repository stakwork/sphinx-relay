// Original file: proto/lightning.proto

import type {
  LightningNode as _lnrpc_LightningNode,
  LightningNode__Output as _lnrpc_LightningNode__Output,
} from '../lnrpc/LightningNode'
import type {
  ChannelEdge as _lnrpc_ChannelEdge,
  ChannelEdge__Output as _lnrpc_ChannelEdge__Output,
} from '../lnrpc/ChannelEdge'

export interface ChannelGraph {
  nodes?: _lnrpc_LightningNode[]
  edges?: _lnrpc_ChannelEdge[]
}

export interface ChannelGraph__Output {
  nodes: _lnrpc_LightningNode__Output[]
  edges: _lnrpc_ChannelEdge__Output[]
}
