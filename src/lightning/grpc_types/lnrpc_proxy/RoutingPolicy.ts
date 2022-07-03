// Original file: proto/rpc_proxy.proto

import type { Long } from '@grpc/proto-loader';

export interface RoutingPolicy {
  'time_lock_delta'?: (number);
  'min_htlc'?: (number | string | Long);
  'fee_base_msat'?: (number | string | Long);
  'fee_rate_milli_msat'?: (number | string | Long);
  'disabled'?: (boolean);
  'max_htlc_msat'?: (number | string | Long);
  'last_update'?: (number);
}

export interface RoutingPolicy__Output {
  'time_lock_delta': (number);
  'min_htlc': (string);
  'fee_base_msat': (string);
  'fee_rate_milli_msat': (string);
  'disabled': (boolean);
  'max_htlc_msat': (string);
  'last_update': (number);
}
