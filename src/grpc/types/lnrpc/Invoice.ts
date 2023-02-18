// Original file: proto/lightning.proto

import type {
  RouteHint as _lnrpc_RouteHint,
  RouteHint__Output as _lnrpc_RouteHint__Output,
} from '../lnrpc/RouteHint'
import type {
  InvoiceHTLC as _lnrpc_InvoiceHTLC,
  InvoiceHTLC__Output as _lnrpc_InvoiceHTLC__Output,
} from '../lnrpc/InvoiceHTLC'
import type {
  Feature as _lnrpc_Feature,
  Feature__Output as _lnrpc_Feature__Output,
} from '../lnrpc/Feature'
import type {
  AMPInvoiceState as _lnrpc_AMPInvoiceState,
  AMPInvoiceState__Output as _lnrpc_AMPInvoiceState__Output,
} from '../lnrpc/AMPInvoiceState'
import type { Long } from '@grpc/proto-loader'

// Original file: proto/lightning.proto

export const _lnrpc_Invoice_InvoiceState = {
  OPEN: 'OPEN',
  SETTLED: 'SETTLED',
  CANCELED: 'CANCELED',
  ACCEPTED: 'ACCEPTED',
} as const

export type _lnrpc_Invoice_InvoiceState =
  | 'OPEN'
  | 0
  | 'SETTLED'
  | 1
  | 'CANCELED'
  | 2
  | 'ACCEPTED'
  | 3

export type _lnrpc_Invoice_InvoiceState__Output =
  (typeof _lnrpc_Invoice_InvoiceState)[keyof typeof _lnrpc_Invoice_InvoiceState]

export interface Invoice {
  memo?: string
  r_preimage?: Buffer | Uint8Array | string
  r_hash?: Buffer | Uint8Array | string
  value?: number | string | Long
  settled?: boolean
  creation_date?: number | string | Long
  settle_date?: number | string | Long
  payment_request?: string
  description_hash?: Buffer | Uint8Array | string
  expiry?: number | string | Long
  fallback_addr?: string
  cltv_expiry?: number | string | Long
  route_hints?: _lnrpc_RouteHint[]
  private?: boolean
  add_index?: number | string | Long
  settle_index?: number | string | Long
  amt_paid?: number | string | Long
  amt_paid_sat?: number | string | Long
  amt_paid_msat?: number | string | Long
  state?: _lnrpc_Invoice_InvoiceState
  htlcs?: _lnrpc_InvoiceHTLC[]
  value_msat?: number | string | Long
  features?: { [key: number]: _lnrpc_Feature }
  is_keysend?: boolean
  payment_addr?: Buffer | Uint8Array | string
  is_amp?: boolean
  amp_invoice_state?: { [key: string]: _lnrpc_AMPInvoiceState }
}

export interface Invoice__Output {
  memo: string
  r_preimage: Buffer
  r_hash: Buffer
  value: string
  settled: boolean
  creation_date: string
  settle_date: string
  payment_request: string
  description_hash: Buffer
  expiry: string
  fallback_addr: string
  cltv_expiry: string
  route_hints: _lnrpc_RouteHint__Output[]
  private: boolean
  add_index: string
  settle_index: string
  amt_paid: string
  amt_paid_sat: string
  amt_paid_msat: string
  state: _lnrpc_Invoice_InvoiceState__Output
  htlcs: _lnrpc_InvoiceHTLC__Output[]
  value_msat: string
  features: { [key: number]: _lnrpc_Feature__Output }
  is_keysend: boolean
  payment_addr: Buffer
  is_amp: boolean
  amp_invoice_state: { [key: string]: _lnrpc_AMPInvoiceState__Output }
}
