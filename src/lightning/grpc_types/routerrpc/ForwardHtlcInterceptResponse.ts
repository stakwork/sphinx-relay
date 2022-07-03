// Original file: proto/router.proto

import type { CircuitKey as _routerrpc_CircuitKey, CircuitKey__Output as _routerrpc_CircuitKey__Output } from '../routerrpc/CircuitKey';
import type { ResolveHoldForwardAction as _routerrpc_ResolveHoldForwardAction } from '../routerrpc/ResolveHoldForwardAction';
import type { _lnrpc_Failure_FailureCode } from '../lnrpc/Failure';

export interface ForwardHtlcInterceptResponse {
  'incoming_circuit_key'?: (_routerrpc_CircuitKey | null);
  'action'?: (_routerrpc_ResolveHoldForwardAction | keyof typeof _routerrpc_ResolveHoldForwardAction);
  'preimage'?: (Buffer | Uint8Array | string);
  'failure_message'?: (Buffer | Uint8Array | string);
  'failure_code'?: (_lnrpc_Failure_FailureCode | keyof typeof _lnrpc_Failure_FailureCode);
}

export interface ForwardHtlcInterceptResponse__Output {
  'incoming_circuit_key': (_routerrpc_CircuitKey__Output | null);
  'action': (keyof typeof _routerrpc_ResolveHoldForwardAction);
  'preimage': (Buffer);
  'failure_message': (Buffer);
  'failure_code': (keyof typeof _lnrpc_Failure_FailureCode);
}
