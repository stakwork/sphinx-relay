// Original file: proto/rpc_proxy.proto

import type { Long } from '@grpc/proto-loader';

export interface ChanInfoRequest {
  'chan_id'?: (number | string | Long);
}

export interface ChanInfoRequest__Output {
  'chan_id': (string);
}
