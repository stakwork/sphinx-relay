// Original file: proto/signer.proto

import type {
  KeyDescriptor as _signrpc_KeyDescriptor,
  KeyDescriptor__Output as _signrpc_KeyDescriptor__Output,
} from '../signrpc/KeyDescriptor'
import type {
  TxOut as _signrpc_TxOut,
  TxOut__Output as _signrpc_TxOut__Output,
} from '../signrpc/TxOut'
import type {
  SignMethod as _signrpc_SignMethod,
  SignMethod__Output as _signrpc_SignMethod__Output,
} from '../signrpc/SignMethod'

export interface SignDescriptor {
  key_desc?: _signrpc_KeyDescriptor | null
  single_tweak?: Buffer | Uint8Array | string
  double_tweak?: Buffer | Uint8Array | string
  witness_script?: Buffer | Uint8Array | string
  output?: _signrpc_TxOut | null
  sighash?: number
  input_index?: number
  sign_method?: _signrpc_SignMethod
  tap_tweak?: Buffer | Uint8Array | string
}

export interface SignDescriptor__Output {
  key_desc: _signrpc_KeyDescriptor__Output | null
  single_tweak: Buffer
  double_tweak: Buffer
  witness_script: Buffer
  output: _signrpc_TxOut__Output | null
  sighash: number
  input_index: number
  sign_method: _signrpc_SignMethod__Output
  tap_tweak: Buffer
}
