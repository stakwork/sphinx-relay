// Original file: proto/lightning.proto

import type {
  Payment as _lnrpc_Payment,
  Payment__Output as _lnrpc_Payment__Output,
} from '../lnrpc/Payment'
import type { Long } from '@grpc/proto-loader'

export interface ListPaymentsResponse {
  payments?: _lnrpc_Payment[]
  first_index_offset?: number | string | Long
  last_index_offset?: number | string | Long
  total_num_payments?: number | string | Long
}

export interface ListPaymentsResponse__Output {
  payments: _lnrpc_Payment__Output[]
  first_index_offset: string
  last_index_offset: string
  total_num_payments: string
}
