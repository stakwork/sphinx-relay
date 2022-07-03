// Original file: proto/rpc_proxy.proto

import type { Long } from '@grpc/proto-loader';

export interface HopHint {
  'node_id'?: (string);
  'chan_id'?: (number | string | Long);
  'fee_base_msat'?: (number);
  'fee_proportional_millionths'?: (number);
  'cltv_expiry_delta'?: (number);
}

export interface HopHint__Output {
  'node_id': (string);
  'chan_id': (string);
  'fee_base_msat': (number);
  'fee_proportional_millionths': (number);
  'cltv_expiry_delta': (number);
}
