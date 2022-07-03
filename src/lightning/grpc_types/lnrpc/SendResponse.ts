// Original file: proto/lightning.proto

import type { Route as _lnrpc_Route, Route__Output as _lnrpc_Route__Output } from '../lnrpc/Route';

export interface SendResponse {
  'payment_error'?: (string);
  'payment_preimage'?: (Buffer | Uint8Array | string);
  'payment_route'?: (_lnrpc_Route | null);
  'payment_hash'?: (Buffer | Uint8Array | string);
}

export interface SendResponse__Output {
  'payment_error': (string);
  'payment_preimage': (Buffer);
  'payment_route': (_lnrpc_Route__Output | null);
  'payment_hash': (Buffer);
}
