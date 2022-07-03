// Original file: proto/rpc_proxy.proto

import type { Long } from '@grpc/proto-loader';

export interface EdgeLocator {
  'channel_id'?: (number | string | Long);
  'direction_reverse'?: (boolean);
}

export interface EdgeLocator__Output {
  'channel_id': (string);
  'direction_reverse': (boolean);
}
