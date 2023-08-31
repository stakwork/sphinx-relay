// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  Invoice as _lnrpc_Invoice,
  Invoice__Output as _lnrpc_Invoice__Output,
} from '../lnrpc/Invoice'

export interface ListInvoiceResponse {
  invoices?: _lnrpc_Invoice[]
  last_index_offset?: number | string | Long
  first_index_offset?: number | string | Long
}

export interface ListInvoiceResponse__Output {
  invoices: _lnrpc_Invoice__Output[]
  last_index_offset: string
  first_index_offset: string
}
