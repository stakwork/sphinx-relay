// Original file: proto/lightning.proto

import type {
  Transaction as _lnrpc_Transaction,
  Transaction__Output as _lnrpc_Transaction__Output,
} from '../lnrpc/Transaction'

export interface TransactionDetails {
  transactions?: _lnrpc_Transaction[]
}

export interface TransactionDetails__Output {
  transactions: _lnrpc_Transaction__Output[]
}
