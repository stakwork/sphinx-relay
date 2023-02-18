// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'

export interface AddInvoiceResponse {
  r_hash?: Buffer | Uint8Array | string
  payment_request?: string
  add_index?: number | string | Long
  payment_addr?: Buffer | Uint8Array | string
}

export interface AddInvoiceResponse__Output {
  r_hash: Buffer
  payment_request: string
  add_index: string
  payment_addr: Buffer
}
