// Original file: proto/router.proto

import type { PaymentState as _routerrpc_PaymentState } from '../routerrpc/PaymentState';
import type { HTLCAttempt as _lnrpc_HTLCAttempt, HTLCAttempt__Output as _lnrpc_HTLCAttempt__Output } from '../lnrpc/HTLCAttempt';

export interface PaymentStatus {
  'state'?: (_routerrpc_PaymentState | keyof typeof _routerrpc_PaymentState);
  'preimage'?: (Buffer | Uint8Array | string);
  'htlcs'?: (_lnrpc_HTLCAttempt)[];
}

export interface PaymentStatus__Output {
  'state': (keyof typeof _routerrpc_PaymentState);
  'preimage': (Buffer);
  'htlcs': (_lnrpc_HTLCAttempt__Output)[];
}
