// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'

export interface ListInvoiceRequest {
  pending_only?: boolean
  index_offset?: number | string | Long
  num_max_invoices?: number | string | Long
  reversed?: boolean
  creation_date_start?: number | string | Long
  creation_date_end?: number | string | Long
}

export interface ListInvoiceRequest__Output {
  pending_only: boolean
  index_offset: string
  num_max_invoices: string
  reversed: boolean
  creation_date_start: string
  creation_date_end: string
}
