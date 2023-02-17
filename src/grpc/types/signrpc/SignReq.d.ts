// Original file: proto/signer.proto

import type {
  SignDescriptor as _signrpc_SignDescriptor,
  SignDescriptor__Output as _signrpc_SignDescriptor__Output,
} from '../signrpc/SignDescriptor'
import type {
  TxOut as _signrpc_TxOut,
  TxOut__Output as _signrpc_TxOut__Output,
} from '../signrpc/TxOut'

export interface SignReq {
  raw_tx_bytes?: Buffer | Uint8Array | string
  sign_descs?: _signrpc_SignDescriptor[]
  prev_outputs?: _signrpc_TxOut[]
}

export interface SignReq__Output {
  raw_tx_bytes: Buffer
  sign_descs: _signrpc_SignDescriptor__Output[]
  prev_outputs: _signrpc_TxOut__Output[]
}
