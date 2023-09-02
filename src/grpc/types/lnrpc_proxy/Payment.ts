// Original file: proto/rpc_proxy.proto

import type { Long } from '@grpc/proto-loader'
import type {
  HTLCAttempt as _lnrpc_proxy_HTLCAttempt,
  HTLCAttempt__Output as _lnrpc_proxy_HTLCAttempt__Output,
} from '../lnrpc_proxy/HTLCAttempt'
import type {
  PaymentFailureReason as _lnrpc_proxy_PaymentFailureReason,
  PaymentFailureReason__Output as _lnrpc_proxy_PaymentFailureReason__Output,
} from '../lnrpc_proxy/PaymentFailureReason'

// Original file: proto/rpc_proxy.proto

export const _lnrpc_proxy_Payment_PaymentStatus = {
  UNKNOWN: 'UNKNOWN',
  IN_FLIGHT: 'IN_FLIGHT',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
} as const

export type _lnrpc_proxy_Payment_PaymentStatus =
  | 'UNKNOWN'
  | 0
  | 'IN_FLIGHT'
  | 1
  | 'SUCCEEDED'
  | 2
  | 'FAILED'
  | 3

export type _lnrpc_proxy_Payment_PaymentStatus__Output =
  (typeof _lnrpc_proxy_Payment_PaymentStatus)[keyof typeof _lnrpc_proxy_Payment_PaymentStatus]

export interface Payment {
  payment_hash?: string
  value?: number | string | Long
  creation_date?: number | string | Long
  fee?: number | string | Long
  payment_preimage?: string
  value_sat?: number | string | Long
  value_msat?: number | string | Long
  payment_request?: string
  status?: _lnrpc_proxy_Payment_PaymentStatus
  fee_sat?: number | string | Long
  fee_msat?: number | string | Long
  creation_time_ns?: number | string | Long
  htlcs?: _lnrpc_proxy_HTLCAttempt[]
  payment_index?: number | string | Long
  failure_reason?: _lnrpc_proxy_PaymentFailureReason
}

export interface Payment__Output {
  payment_hash: string
  value: string
  creation_date: string
  fee: string
  payment_preimage: string
  value_sat: string
  value_msat: string
  payment_request: string
  status: _lnrpc_proxy_Payment_PaymentStatus__Output
  fee_sat: string
  fee_msat: string
  creation_time_ns: string
  htlcs: _lnrpc_proxy_HTLCAttempt__Output[]
  payment_index: string
  failure_reason: _lnrpc_proxy_PaymentFailureReason__Output
}
