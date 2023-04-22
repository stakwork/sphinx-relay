// Original file: proto/cln/node.proto

import type {
  ListsendpaysPayments as _cln_ListsendpaysPayments,
  ListsendpaysPayments__Output as _cln_ListsendpaysPayments__Output,
} from '../cln/ListsendpaysPayments'

export interface ListsendpaysResponse {
  payments?: _cln_ListsendpaysPayments[]
}

export interface ListsendpaysResponse__Output {
  payments: _cln_ListsendpaysPayments__Output[]
}
