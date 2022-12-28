// Original file: proto/lightning.proto

import type {
  NodeUpdate as _lnrpc_NodeUpdate,
  NodeUpdate__Output as _lnrpc_NodeUpdate__Output,
} from '../lnrpc/NodeUpdate'
import type {
  ChannelEdgeUpdate as _lnrpc_ChannelEdgeUpdate,
  ChannelEdgeUpdate__Output as _lnrpc_ChannelEdgeUpdate__Output,
} from '../lnrpc/ChannelEdgeUpdate'
import type {
  ClosedChannelUpdate as _lnrpc_ClosedChannelUpdate,
  ClosedChannelUpdate__Output as _lnrpc_ClosedChannelUpdate__Output,
} from '../lnrpc/ClosedChannelUpdate'

export interface GraphTopologyUpdate {
  node_updates?: _lnrpc_NodeUpdate[]
  channel_updates?: _lnrpc_ChannelEdgeUpdate[]
  closed_chans?: _lnrpc_ClosedChannelUpdate[]
}

export interface GraphTopologyUpdate__Output {
  node_updates: _lnrpc_NodeUpdate__Output[]
  channel_updates: _lnrpc_ChannelEdgeUpdate__Output[]
  closed_chans: _lnrpc_ClosedChannelUpdate__Output[]
}
