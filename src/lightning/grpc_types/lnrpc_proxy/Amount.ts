// Original file: proto/rpc_proxy.proto

import type { Long } from '@grpc/proto-loader';

export interface Amount {
  'sat'?: (number | string | Long);
  'msat'?: (number | string | Long);
}

export interface Amount__Output {
  'sat': (string);
  'msat': (string);
}
