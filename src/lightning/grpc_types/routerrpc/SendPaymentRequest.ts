// Original file: proto/router.proto

import type { RouteHint as _lnrpc_RouteHint, RouteHint__Output as _lnrpc_RouteHint__Output } from '../lnrpc/RouteHint';
import type { FeatureBit as _lnrpc_FeatureBit } from '../lnrpc/FeatureBit';
import type { Long } from '@grpc/proto-loader';

export interface SendPaymentRequest {
  'dest'?: (Buffer | Uint8Array | string);
  'amt'?: (number | string | Long);
  'payment_hash'?: (Buffer | Uint8Array | string);
  'final_cltv_delta'?: (number);
  'payment_request'?: (string);
  'timeout_seconds'?: (number);
  'fee_limit_sat'?: (number | string | Long);
  'outgoing_chan_id'?: (number | string | Long);
  'cltv_limit'?: (number);
  'route_hints'?: (_lnrpc_RouteHint)[];
  'dest_custom_records'?: ({[key: number]: Buffer | Uint8Array | string});
  'amt_msat'?: (number | string | Long);
  'fee_limit_msat'?: (number | string | Long);
  'last_hop_pubkey'?: (Buffer | Uint8Array | string);
  'allow_self_payment'?: (boolean);
  'dest_features'?: (_lnrpc_FeatureBit | keyof typeof _lnrpc_FeatureBit)[];
  'max_parts'?: (number);
  'no_inflight_updates'?: (boolean);
  'outgoing_chan_ids'?: (number | string | Long)[];
  'payment_addr'?: (Buffer | Uint8Array | string);
  'max_shard_size_msat'?: (number | string | Long);
  'amp'?: (boolean);
  'time_pref'?: (number | string);
}

export interface SendPaymentRequest__Output {
  'dest': (Buffer);
  'amt': (string);
  'payment_hash': (Buffer);
  'final_cltv_delta': (number);
  'payment_request': (string);
  'timeout_seconds': (number);
  'fee_limit_sat': (string);
  'outgoing_chan_id': (string);
  'cltv_limit': (number);
  'route_hints': (_lnrpc_RouteHint__Output)[];
  'dest_custom_records': ({[key: number]: Buffer});
  'amt_msat': (string);
  'fee_limit_msat': (string);
  'last_hop_pubkey': (Buffer);
  'allow_self_payment': (boolean);
  'dest_features': (keyof typeof _lnrpc_FeatureBit)[];
  'max_parts': (number);
  'no_inflight_updates': (boolean);
  'outgoing_chan_ids': (string)[];
  'payment_addr': (Buffer);
  'max_shard_size_msat': (string);
  'amp': (boolean);
  'time_pref': (number);
}
