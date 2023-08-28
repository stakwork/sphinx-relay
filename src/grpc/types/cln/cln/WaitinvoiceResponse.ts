// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'
import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

// Original file: proto/cln/node.proto

export const _cln_WaitinvoiceResponse_WaitinvoiceStatus = {
  PAID: 'PAID',
  EXPIRED: 'EXPIRED',
} as const

export type _cln_WaitinvoiceResponse_WaitinvoiceStatus =
  | 'PAID'
  | 0
  | 'EXPIRED'
  | 1

export type _cln_WaitinvoiceResponse_WaitinvoiceStatus__Output =
  (typeof _cln_WaitinvoiceResponse_WaitinvoiceStatus)[keyof typeof _cln_WaitinvoiceResponse_WaitinvoiceStatus]

export interface WaitinvoiceResponse {
  label?: string
  description?: string
  payment_hash?: Buffer | Uint8Array | string
  status?: _cln_WaitinvoiceResponse_WaitinvoiceStatus
  expires_at?: number | string | Long
  amount_msat?: _cln_Amount | null
  bolt11?: string
  bolt12?: string
  pay_index?: number | string | Long
  amount_received_msat?: _cln_Amount | null
  paid_at?: number | string | Long
  payment_preimage?: Buffer | Uint8Array | string
  _amount_msat?: 'amount_msat'
  _bolt11?: 'bolt11'
  _bolt12?: 'bolt12'
  _pay_index?: 'pay_index'
  _amount_received_msat?: 'amount_received_msat'
  _paid_at?: 'paid_at'
  _payment_preimage?: 'payment_preimage'
}

export interface WaitinvoiceResponse__Output {
  label: string
  description: string
  payment_hash: Buffer
  status: _cln_WaitinvoiceResponse_WaitinvoiceStatus__Output
  expires_at: string
  amount_msat?: _cln_Amount__Output | null
  bolt11?: string
  bolt12?: string
  pay_index?: string
  amount_received_msat?: _cln_Amount__Output | null
  paid_at?: string
  payment_preimage?: Buffer
  _amount_msat: 'amount_msat'
  _bolt11: 'bolt11'
  _bolt12: 'bolt12'
  _pay_index: 'pay_index'
  _amount_received_msat: 'amount_received_msat'
  _paid_at: 'paid_at'
  _payment_preimage: 'payment_preimage'
}
