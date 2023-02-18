// Original file: proto/router.proto

import type { Long } from '@grpc/proto-loader'

export interface RouteFeeRequest {
  dest?: Buffer | Uint8Array | string
  amt_sat?: number | string | Long
}

export interface RouteFeeRequest__Output {
  dest: Buffer
  amt_sat: string
}
