// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type { Long } from '@grpc/proto-loader'

// Original file: proto/cln/node.proto

export const _cln_ListsendpaysPayments_ListsendpaysPaymentsStatus = {
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  COMPLETE: 'COMPLETE',
} as const

export type _cln_ListsendpaysPayments_ListsendpaysPaymentsStatus =
  | 'PENDING'
  | 0
  | 'FAILED'
  | 1
  | 'COMPLETE'
  | 2

export type _cln_ListsendpaysPayments_ListsendpaysPaymentsStatus__Output =
  (typeof _cln_ListsendpaysPayments_ListsendpaysPaymentsStatus)[keyof typeof _cln_ListsendpaysPayments_ListsendpaysPaymentsStatus]

export interface ListsendpaysPayments {
  id?: number | string | Long
  groupid?: number | string | Long
  payment_hash?: Buffer | Uint8Array | string
  status?: _cln_ListsendpaysPayments_ListsendpaysPaymentsStatus
  amount_msat?: _cln_Amount | null
  destination?: Buffer | Uint8Array | string
  created_at?: number | string | Long
  amount_sent_msat?: _cln_Amount | null
  label?: string
  bolt11?: string
  bolt12?: string
  payment_preimage?: Buffer | Uint8Array | string
  erroronion?: Buffer | Uint8Array | string
  description?: string
  partid?: number | string | Long
  _partid?: 'partid'
  _amount_msat?: 'amount_msat'
  _destination?: 'destination'
  _label?: 'label'
  _bolt11?: 'bolt11'
  _description?: 'description'
  _bolt12?: 'bolt12'
  _payment_preimage?: 'payment_preimage'
  _erroronion?: 'erroronion'
}

export interface ListsendpaysPayments__Output {
  id: string
  groupid: string
  payment_hash: Buffer
  status: _cln_ListsendpaysPayments_ListsendpaysPaymentsStatus__Output
  amount_msat?: _cln_Amount__Output | null
  destination?: Buffer
  created_at: string
  amount_sent_msat: _cln_Amount__Output | null
  label?: string
  bolt11?: string
  bolt12?: string
  payment_preimage?: Buffer
  erroronion?: Buffer
  description?: string
  partid?: string
  _partid: 'partid'
  _amount_msat: 'amount_msat'
  _destination: 'destination'
  _label: 'label'
  _bolt11: 'bolt11'
  _description: 'description'
  _bolt12: 'bolt12'
  _payment_preimage: 'payment_preimage'
  _erroronion: 'erroronion'
}
