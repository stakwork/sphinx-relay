// Original file: proto/walletkit.proto

import type {
  TransactionDetails as _lnrpc_TransactionDetails,
  TransactionDetails__Output as _lnrpc_TransactionDetails__Output,
} from '../lnrpc/TransactionDetails'

export interface _walletrpc_ListSweepsResponse_TransactionIDs {
  transaction_ids?: string[]
}

export interface _walletrpc_ListSweepsResponse_TransactionIDs__Output {
  transaction_ids: string[]
}

export interface ListSweepsResponse {
  transaction_details?: _lnrpc_TransactionDetails | null
  transaction_ids?: _walletrpc_ListSweepsResponse_TransactionIDs | null
  sweeps?: 'transaction_details' | 'transaction_ids'
}

export interface ListSweepsResponse__Output {
  transaction_details?: _lnrpc_TransactionDetails__Output | null
  transaction_ids?: _walletrpc_ListSweepsResponse_TransactionIDs__Output | null
  sweeps: 'transaction_details' | 'transaction_ids'
}
