// Original file: proto/router.proto

import type { Long } from '@grpc/proto-loader';

export interface QueryProbabilityRequest {
  'from_node'?: (Buffer | Uint8Array | string);
  'to_node'?: (Buffer | Uint8Array | string);
  'amt_msat'?: (number | string | Long);
}

export interface QueryProbabilityRequest__Output {
  'from_node': (Buffer);
  'to_node': (Buffer);
  'amt_msat': (string);
}
