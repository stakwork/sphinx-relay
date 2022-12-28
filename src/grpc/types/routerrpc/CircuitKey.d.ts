// Original file: proto/router.proto

import type { Long } from '@grpc/proto-loader'

export interface CircuitKey {
  chan_id?: number | string | Long
  htlc_id?: number | string | Long
}

export interface CircuitKey__Output {
  chan_id: string
  htlc_id: string
}
