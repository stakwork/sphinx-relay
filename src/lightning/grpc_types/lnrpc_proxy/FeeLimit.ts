// Original file: proto/rpc_proxy.proto

import type { Long } from '@grpc/proto-loader';

export interface FeeLimit {
  'fixed'?: (number | string | Long);
  'percent'?: (number | string | Long);
  'fixed_msat'?: (number | string | Long);
  'limit'?: "fixed"|"fixed_msat"|"percent";
}

export interface FeeLimit__Output {
  'fixed'?: (string);
  'percent'?: (string);
  'fixed_msat'?: (string);
  'limit': "fixed"|"fixed_msat"|"percent";
}
