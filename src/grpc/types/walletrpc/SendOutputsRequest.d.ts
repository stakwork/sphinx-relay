// Original file: proto/walletkit.proto

import type {
  TxOut as _signrpc_TxOut,
  TxOut__Output as _signrpc_TxOut__Output,
} from '../signrpc/TxOut'
import type { Long } from '@grpc/proto-loader'

export interface SendOutputsRequest {
  sat_per_kw?: number | string | Long
  outputs?: _signrpc_TxOut[]
  label?: string
  min_confs?: number
  spend_unconfirmed?: boolean
}

export interface SendOutputsRequest__Output {
  sat_per_kw: string
  outputs: _signrpc_TxOut__Output[]
  label: string
  min_confs: number
  spend_unconfirmed: boolean
}
