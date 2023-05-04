// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'

export interface WaitsendpayRequest {
  payment_hash?: Buffer | Uint8Array | string
  partid?: number | string | Long
  timeout?: number
  groupid?: number | string | Long
  _timeout?: 'timeout'
  _partid?: 'partid'
  _groupid?: 'groupid'
}

export interface WaitsendpayRequest__Output {
  payment_hash: Buffer
  partid?: string
  timeout?: number
  groupid?: string
  _timeout: 'timeout'
  _partid: 'partid'
  _groupid: 'groupid'
}
