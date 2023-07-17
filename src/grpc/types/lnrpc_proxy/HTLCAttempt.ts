// Original file: proto/rpc_proxy.proto

import type { Long } from '@grpc/proto-loader'
import type {
  Route as _lnrpc_proxy_Route,
  Route__Output as _lnrpc_proxy_Route__Output,
} from '../lnrpc_proxy/Route'
import type {
  Failure as _lnrpc_proxy_Failure,
  Failure__Output as _lnrpc_proxy_Failure__Output,
} from '../lnrpc_proxy/Failure'

// Original file: proto/rpc_proxy.proto

export const _lnrpc_proxy_HTLCAttempt_HTLCStatus = {
  IN_FLIGHT: 'IN_FLIGHT',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
} as const

export type _lnrpc_proxy_HTLCAttempt_HTLCStatus =
  | 'IN_FLIGHT'
  | 0
  | 'SUCCEEDED'
  | 1
  | 'FAILED'
  | 2

export type _lnrpc_proxy_HTLCAttempt_HTLCStatus__Output =
  typeof _lnrpc_proxy_HTLCAttempt_HTLCStatus[keyof typeof _lnrpc_proxy_HTLCAttempt_HTLCStatus]

export interface HTLCAttempt {
  status?: _lnrpc_proxy_HTLCAttempt_HTLCStatus
  route?: _lnrpc_proxy_Route | null
  attempt_time_ns?: number | string | Long
  resolve_time_ns?: number | string | Long
  failure?: _lnrpc_proxy_Failure | null
  preimage?: Buffer | Uint8Array | string
}

export interface HTLCAttempt__Output {
  status: _lnrpc_proxy_HTLCAttempt_HTLCStatus__Output
  route: _lnrpc_proxy_Route__Output | null
  attempt_time_ns: string
  resolve_time_ns: string
  failure: _lnrpc_proxy_Failure__Output | null
  preimage: Buffer
}
