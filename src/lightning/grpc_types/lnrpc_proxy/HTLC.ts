// Original file: proto/rpc_proxy.proto

import type { Long } from '@grpc/proto-loader';

export interface HTLC {
  'incoming'?: (boolean);
  'amount'?: (number | string | Long);
  'hash_lock'?: (Buffer | Uint8Array | string);
  'expiration_height'?: (number);
  'htlc_index'?: (number | string | Long);
  'forwarding_channel'?: (number | string | Long);
  'forwarding_htlc_index'?: (number | string | Long);
}

export interface HTLC__Output {
  'incoming': (boolean);
  'amount': (string);
  'hash_lock': (Buffer);
  'expiration_height': (number);
  'htlc_index': (string);
  'forwarding_channel': (string);
  'forwarding_htlc_index': (string);
}
