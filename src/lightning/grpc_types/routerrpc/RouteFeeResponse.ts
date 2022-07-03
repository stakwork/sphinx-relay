// Original file: proto/router.proto

import type { Long } from '@grpc/proto-loader';

export interface RouteFeeResponse {
  'routing_fee_msat'?: (number | string | Long);
  'time_lock_delay'?: (number | string | Long);
}

export interface RouteFeeResponse__Output {
  'routing_fee_msat': (string);
  'time_lock_delay': (string);
}
