// Original file: proto/cln/node.proto

import type {
  ListtransactionsTransactionsInputs as _cln_ListtransactionsTransactionsInputs,
  ListtransactionsTransactionsInputs__Output as _cln_ListtransactionsTransactionsInputs__Output,
} from '../cln/ListtransactionsTransactionsInputs'
import type {
  ListtransactionsTransactionsOutputs as _cln_ListtransactionsTransactionsOutputs,
  ListtransactionsTransactionsOutputs__Output as _cln_ListtransactionsTransactionsOutputs__Output,
} from '../cln/ListtransactionsTransactionsOutputs'

export interface ListtransactionsTransactions {
  hash?: Buffer | Uint8Array | string
  rawtx?: Buffer | Uint8Array | string
  blockheight?: number
  txindex?: number
  locktime?: number
  version?: number
  inputs?: _cln_ListtransactionsTransactionsInputs[]
  outputs?: _cln_ListtransactionsTransactionsOutputs[]
}

export interface ListtransactionsTransactions__Output {
  hash: Buffer
  rawtx: Buffer
  blockheight: number
  txindex: number
  locktime: number
  version: number
  inputs: _cln_ListtransactionsTransactionsInputs__Output[]
  outputs: _cln_ListtransactionsTransactionsOutputs__Output[]
}
