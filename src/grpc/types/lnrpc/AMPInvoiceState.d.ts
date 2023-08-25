// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  InvoiceHTLCState as _lnrpc_InvoiceHTLCState,
  InvoiceHTLCState__Output as _lnrpc_InvoiceHTLCState__Output,
} from '../lnrpc/InvoiceHTLCState'

export interface AMPInvoiceState {
  state?: _lnrpc_InvoiceHTLCState
  settle_index?: number | string | Long
  settle_time?: number | string | Long
  amt_paid_msat?: number | string | Long
}

export interface AMPInvoiceState__Output {
  state: _lnrpc_InvoiceHTLCState__Output
  settle_index: string
  settle_time: string
  amt_paid_msat: string
}
