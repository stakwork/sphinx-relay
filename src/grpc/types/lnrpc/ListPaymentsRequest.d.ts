// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'

export interface ListPaymentsRequest {
  include_incomplete?: boolean
  index_offset?: number | string | Long
  max_payments?: number | string | Long
  reversed?: boolean
  count_total_payments?: boolean
  creation_date_start?: number | string | Long
  creation_date_end?: number | string | Long
}

export interface ListPaymentsRequest__Output {
  include_incomplete: boolean
  index_offset: string
  max_payments: string
  reversed: boolean
  count_total_payments: boolean
  creation_date_start: string
  creation_date_end: string
}
