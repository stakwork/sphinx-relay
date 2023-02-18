// Original file: proto/walletkit.proto

import type {
  OutPoint as _lnrpc_OutPoint,
  OutPoint__Output as _lnrpc_OutPoint__Output,
} from '../lnrpc/OutPoint'
import type { Long } from '@grpc/proto-loader'

export interface TxTemplate {
  inputs?: _lnrpc_OutPoint[]
  outputs?: { [key: string]: number | string | Long }
}

export interface TxTemplate__Output {
  inputs: _lnrpc_OutPoint__Output[]
  outputs: { [key: string]: string }
}
