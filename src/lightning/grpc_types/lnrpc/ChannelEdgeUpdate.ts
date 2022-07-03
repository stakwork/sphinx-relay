// Original file: proto/lightning.proto

import type { ChannelPoint as _lnrpc_ChannelPoint, ChannelPoint__Output as _lnrpc_ChannelPoint__Output } from '../lnrpc/ChannelPoint';
import type { RoutingPolicy as _lnrpc_RoutingPolicy, RoutingPolicy__Output as _lnrpc_RoutingPolicy__Output } from '../lnrpc/RoutingPolicy';
import type { Long } from '@grpc/proto-loader';

export interface ChannelEdgeUpdate {
  'chan_id'?: (number | string | Long);
  'chan_point'?: (_lnrpc_ChannelPoint | null);
  'capacity'?: (number | string | Long);
  'routing_policy'?: (_lnrpc_RoutingPolicy | null);
  'advertising_node'?: (string);
  'connecting_node'?: (string);
}

export interface ChannelEdgeUpdate__Output {
  'chan_id': (string);
  'chan_point': (_lnrpc_ChannelPoint__Output | null);
  'capacity': (string);
  'routing_policy': (_lnrpc_RoutingPolicy__Output | null);
  'advertising_node': (string);
  'connecting_node': (string);
}
