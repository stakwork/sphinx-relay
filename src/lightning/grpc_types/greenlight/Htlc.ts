// Original file: proto/greenlight.proto

import type { Long } from '@grpc/proto-loader';

export interface Htlc {
  'direction'?: (string);
  'id'?: (number | string | Long);
  'amount'?: (string);
  'expiry'?: (number | string | Long);
  'payment_hash'?: (string);
  'state'?: (string);
  'local_trimmed'?: (boolean);
}

export interface Htlc__Output {
  'direction': (string);
  'id': (string);
  'amount': (string);
  'expiry': (string);
  'payment_hash': (string);
  'state': (string);
  'local_trimmed': (boolean);
}
