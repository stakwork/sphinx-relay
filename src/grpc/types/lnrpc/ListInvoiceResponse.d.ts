// Original file: proto/lightning.proto

import type {
  Invoice as _lnrpc_Invoice,
  Invoice__Output as _lnrpc_Invoice__Output,
} from '../lnrpc/Invoice'
import type { Long } from '@grpc/proto-loader'

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
