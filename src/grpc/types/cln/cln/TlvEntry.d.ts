// Original file: proto/cln/primitives.proto

import type { Long } from '@grpc/proto-loader'

export interface TlvEntry {
  type?: number | string | Long
  value?: Buffer | Uint8Array | string
}

export interface TlvEntry__Output {
  type: string
  value: Buffer
}
