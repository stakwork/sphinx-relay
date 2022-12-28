// Original file: proto/rpc_proxy.proto

import type { Long } from '@grpc/proto-loader'

export interface MPPRecord {
  total_amt_msat?: number | string | Long
  payment_addr?: Buffer | Uint8Array | string
}

export interface MPPRecord__Output {
  total_amt_msat: string
  payment_addr: Buffer
}
