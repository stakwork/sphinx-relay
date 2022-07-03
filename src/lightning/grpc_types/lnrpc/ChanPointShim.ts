// Original file: proto/lightning.proto

import type { ChannelPoint as _lnrpc_ChannelPoint, ChannelPoint__Output as _lnrpc_ChannelPoint__Output } from '../lnrpc/ChannelPoint';
import type { KeyDescriptor as _lnrpc_KeyDescriptor, KeyDescriptor__Output as _lnrpc_KeyDescriptor__Output } from '../lnrpc/KeyDescriptor';
import type { Long } from '@grpc/proto-loader';

export interface ChanPointShim {
  'amt'?: (number | string | Long);
  'chan_point'?: (_lnrpc_ChannelPoint | null);
  'local_key'?: (_lnrpc_KeyDescriptor | null);
  'remote_key'?: (Buffer | Uint8Array | string);
  'pending_chan_id'?: (Buffer | Uint8Array | string);
  'thaw_height'?: (number);
}

export interface ChanPointShim__Output {
  'amt': (string);
  'chan_point': (_lnrpc_ChannelPoint__Output | null);
  'local_key': (_lnrpc_KeyDescriptor__Output | null);
  'remote_key': (Buffer);
  'pending_chan_id': (Buffer);
  'thaw_height': (number);
}
