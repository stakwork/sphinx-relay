// Original file: proto/lightning.proto

import type { ChannelPoint as _lnrpc_ChannelPoint, ChannelPoint__Output as _lnrpc_ChannelPoint__Output } from '../lnrpc/ChannelPoint';
import type { Long } from '@grpc/proto-loader';

export interface ClosedChannelUpdate {
  'chan_id'?: (number | string | Long);
  'capacity'?: (number | string | Long);
  'closed_height'?: (number);
  'chan_point'?: (_lnrpc_ChannelPoint | null);
}

export interface ClosedChannelUpdate__Output {
  'chan_id': (string);
  'capacity': (string);
  'closed_height': (number);
  'chan_point': (_lnrpc_ChannelPoint__Output | null);
}
