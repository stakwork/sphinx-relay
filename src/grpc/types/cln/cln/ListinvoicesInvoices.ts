// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type { Long } from '@grpc/proto-loader'

// Original file: proto/cln/node.proto

export const _cln_ListinvoicesInvoices_ListinvoicesInvoicesStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  EXPIRED: 'EXPIRED',
} as const

export type _cln_ListinvoicesInvoices_ListinvoicesInvoicesStatus =
  | 'UNPAID'
  | 0
  | 'PAID'
  | 1
  | 'EXPIRED'
  | 2

export type _cln_ListinvoicesInvoices_ListinvoicesInvoicesStatus__Output =
  typeof _cln_ListinvoicesInvoices_ListinvoicesInvoicesStatus[keyof typeof _cln_ListinvoicesInvoices_ListinvoicesInvoicesStatus]

export interface ListinvoicesInvoices {
  label?: string
  description?: string
  payment_hash?: Buffer | Uint8Array | string
  status?: _cln_ListinvoicesInvoices_ListinvoicesInvoicesStatus
  expires_at?: number | string | Long
  amount_msat?: _cln_Amount | null
  bolt11?: string
  bolt12?: string
  local_offer_id?: Buffer | Uint8Array | string
  pay_index?: number | string | Long
  amount_received_msat?: _cln_Amount | null
  paid_at?: number | string | Long
  payment_preimage?: Buffer | Uint8Array | string
  invreq_payer_note?: string
  _description?: 'description'
  _amount_msat?: 'amount_msat'
  _bolt11?: 'bolt11'
  _bolt12?: 'bolt12'
  _local_offer_id?: 'local_offer_id'
  _invreq_payer_note?: 'invreq_payer_note'
  _pay_index?: 'pay_index'
  _amount_received_msat?: 'amount_received_msat'
  _paid_at?: 'paid_at'
  _payment_preimage?: 'payment_preimage'
}

export interface ListinvoicesInvoices__Output {
  label: string
  description?: string
  payment_hash: Buffer
  status: _cln_ListinvoicesInvoices_ListinvoicesInvoicesStatus__Output
  expires_at: string
  amount_msat?: _cln_Amount__Output | null
  bolt11?: string
  bolt12?: string
  local_offer_id?: Buffer
  pay_index?: string
  amount_received_msat?: _cln_Amount__Output | null
  paid_at?: string
  payment_preimage?: Buffer
  invreq_payer_note?: string
  _description: 'description'
  _amount_msat: 'amount_msat'
  _bolt11: 'bolt11'
  _bolt12: 'bolt12'
  _local_offer_id: 'local_offer_id'
  _invreq_payer_note: 'invreq_payer_note'
  _pay_index: 'pay_index'
  _amount_received_msat: 'amount_received_msat'
  _paid_at: 'paid_at'
  _payment_preimage: 'payment_preimage'
}
