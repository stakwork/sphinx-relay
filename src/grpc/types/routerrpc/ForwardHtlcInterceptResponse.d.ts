// Original file: proto/router.proto

import type {
  CircuitKey as _routerrpc_CircuitKey,
  CircuitKey__Output as _routerrpc_CircuitKey__Output,
} from '../routerrpc/CircuitKey'
import type {
  ResolveHoldForwardAction as _routerrpc_ResolveHoldForwardAction,
  ResolveHoldForwardAction__Output as _routerrpc_ResolveHoldForwardAction__Output,
} from '../routerrpc/ResolveHoldForwardAction'
import type {
  _lnrpc_Failure_FailureCode,
  _lnrpc_Failure_FailureCode__Output,
} from '../lnrpc/Failure'

export interface ForwardHtlcInterceptResponse {
  incoming_circuit_key?: _routerrpc_CircuitKey | null
  action?: _routerrpc_ResolveHoldForwardAction
  preimage?: Buffer | Uint8Array | string
  failure_message?: Buffer | Uint8Array | string
  failure_code?: _lnrpc_Failure_FailureCode
}

export interface ForwardHtlcInterceptResponse__Output {
  incoming_circuit_key: _routerrpc_CircuitKey__Output | null
  action: _routerrpc_ResolveHoldForwardAction__Output
  preimage: Buffer
  failure_message: Buffer
  failure_code: _lnrpc_Failure_FailureCode__Output
}
