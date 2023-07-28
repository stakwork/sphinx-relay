// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type { Long } from '@grpc/proto-loader'

// Original file: proto/cln/node.proto

export const _cln_CreateinvoiceResponse_CreateinvoiceStatus = {
  PAID: 'PAID',
  EXPIRED: 'EXPIRED',
  UNPAID: 'UNPAID',
} as const

export type _cln_CreateinvoiceResponse_CreateinvoiceStatus =
  | 'PAID'
  | 0
  | 'EXPIRED'
  | 1
  | 'UNPAID'
  | 2

export type _cln_CreateinvoiceResponse_CreateinvoiceStatus__Output =
  (typeof _cln_CreateinvoiceResponse_CreateinvoiceStatus)[keyof typeof _cln_CreateinvoiceResponse_CreateinvoiceStatus]

export interface CreateinvoiceResponse {
  label?: string
  bolt11?: string
  bolt12?: string
  payment_hash?: Buffer | Uint8Array | string
  amount_msat?: _cln_Amount | null
  status?: _cln_CreateinvoiceResponse_CreateinvoiceStatus
  description?: string
  expires_at?: number | string | Long
  pay_index?: number | string | Long
  amount_received_msat?: _cln_Amount | null
  paid_at?: number | string | Long
  payment_preimage?: Buffer | Uint8Array | string
  local_offer_id?: Buffer | Uint8Array | string
  invreq_payer_note?: string
  _bolt11?: 'bolt11'
  _bolt12?: 'bolt12'
  _amount_msat?: 'amount_msat'
  _pay_index?: 'pay_index'
  _amount_received_msat?: 'amount_received_msat'
  _paid_at?: 'paid_at'
  _payment_preimage?: 'payment_preimage'
  _local_offer_id?: 'local_offer_id'
  _invreq_payer_note?: 'invreq_payer_note'
}

export interface CreateinvoiceResponse__Output {
  label: string
  bolt11?: string
  bolt12?: string
  payment_hash: Buffer
  amount_msat?: _cln_Amount__Output | null
  status: _cln_CreateinvoiceResponse_CreateinvoiceStatus__Output
  description: string
  expires_at: string
  pay_index?: string
  amount_received_msat?: _cln_Amount__Output | null
  paid_at?: string
  payment_preimage?: Buffer
  local_offer_id?: Buffer
  invreq_payer_note?: string
  _bolt11: 'bolt11'
  _bolt12: 'bolt12'
  _amount_msat: 'amount_msat'
  _pay_index: 'pay_index'
  _amount_received_msat: 'amount_received_msat'
  _paid_at: 'paid_at'
  _payment_preimage: 'payment_preimage'
  _local_offer_id: 'local_offer_id'
  _invreq_payer_note: 'invreq_payer_note'
}
