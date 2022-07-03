// Original file: proto/lightning.proto

import type { FeeLimit as _lnrpc_FeeLimit, FeeLimit__Output as _lnrpc_FeeLimit__Output } from '../lnrpc/FeeLimit';
import type { FeatureBit as _lnrpc_FeatureBit } from '../lnrpc/FeatureBit';
import type { Long } from '@grpc/proto-loader';

export interface SendRequest {
  'dest'?: (Buffer | Uint8Array | string);
  'dest_string'?: (string);
  'amt'?: (number | string | Long);
  'payment_hash'?: (Buffer | Uint8Array | string);
  'payment_hash_string'?: (string);
  'payment_request'?: (string);
  'final_cltv_delta'?: (number);
  'fee_limit'?: (_lnrpc_FeeLimit | null);
  'outgoing_chan_id'?: (number | string | Long);
  'cltv_limit'?: (number);
  'dest_custom_records'?: ({[key: number]: Buffer | Uint8Array | string});
  'amt_msat'?: (number | string | Long);
  'last_hop_pubkey'?: (Buffer | Uint8Array | string);
  'allow_self_payment'?: (boolean);
  'dest_features'?: (_lnrpc_FeatureBit | keyof typeof _lnrpc_FeatureBit)[];
  'payment_addr'?: (Buffer | Uint8Array | string);
}

export interface SendRequest__Output {
  'dest': (Buffer);
  'dest_string': (string);
  'amt': (string);
  'payment_hash': (Buffer);
  'payment_hash_string': (string);
  'payment_request': (string);
  'final_cltv_delta': (number);
  'fee_limit': (_lnrpc_FeeLimit__Output | null);
  'outgoing_chan_id': (string);
  'cltv_limit': (number);
  'dest_custom_records': ({[key: number]: Buffer});
  'amt_msat': (string);
  'last_hop_pubkey': (Buffer);
  'allow_self_payment': (boolean);
  'dest_features': (keyof typeof _lnrpc_FeatureBit)[];
  'payment_addr': (Buffer);
}
