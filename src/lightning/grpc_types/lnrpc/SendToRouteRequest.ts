// Original file: proto/lightning.proto

import type { Route as _lnrpc_Route, Route__Output as _lnrpc_Route__Output } from '../lnrpc/Route';

export interface SendToRouteRequest {
  'payment_hash'?: (Buffer | Uint8Array | string);
  'payment_hash_string'?: (string);
  'route'?: (_lnrpc_Route | null);
}

export interface SendToRouteRequest__Output {
  'payment_hash': (Buffer);
  'payment_hash_string': (string);
  'route': (_lnrpc_Route__Output | null);
}
