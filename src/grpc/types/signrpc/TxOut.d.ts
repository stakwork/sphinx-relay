// Original file: proto/signer.proto

import type { Long } from '@grpc/proto-loader'

export interface TxOut {
  value?: number | string | Long
  pk_script?: Buffer | Uint8Array | string
}

export interface TxOut__Output {
  value: string
  pk_script: Buffer
}
