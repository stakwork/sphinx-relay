// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type { Long } from '@grpc/proto-loader'

// Original file: proto/cln/node.proto

export const _cln_DelinvoiceResponse_DelinvoiceStatus = {
  PAID: 'PAID',
  EXPIRED: 'EXPIRED',
  UNPAID: 'UNPAID',
} as const

export type _cln_DelinvoiceResponse_DelinvoiceStatus =
  | 'PAID'
  | 0
  | 'EXPIRED'
  | 1
  | 'UNPAID'
  | 2

export type _cln_DelinvoiceResponse_DelinvoiceStatus__Output =
  (typeof _cln_DelinvoiceResponse_DelinvoiceStatus)[keyof typeof _cln_DelinvoiceResponse_DelinvoiceStatus]

export interface DelinvoiceResponse {
  label?: string
  bolt11?: string
  bolt12?: string
  amount_msat?: _cln_Amount | null
  description?: string
  payment_hash?: Buffer | Uint8Array | string
  status?: _cln_DelinvoiceResponse_DelinvoiceStatus
  expires_at?: number | string | Long
  local_offer_id?: Buffer | Uint8Array | string
  invreq_payer_note?: string
  _bolt11?: 'bolt11'
  _bolt12?: 'bolt12'
  _amount_msat?: 'amount_msat'
  _description?: 'description'
  _local_offer_id?: 'local_offer_id'
  _invreq_payer_note?: 'invreq_payer_note'
}

export interface DelinvoiceResponse__Output {
  label: string
  bolt11?: string
  bolt12?: string
  amount_msat?: _cln_Amount__Output | null
  description?: string
  payment_hash: Buffer
  status: _cln_DelinvoiceResponse_DelinvoiceStatus__Output
  expires_at: string
  local_offer_id?: Buffer
  invreq_payer_note?: string
  _bolt11: 'bolt11'
  _bolt12: 'bolt12'
  _amount_msat: 'amount_msat'
  _description: 'description'
  _local_offer_id: 'local_offer_id'
  _invreq_payer_note: 'invreq_payer_note'
}
