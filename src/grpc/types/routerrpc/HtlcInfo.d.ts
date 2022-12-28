// Original file: proto/router.proto

import type { Long } from '@grpc/proto-loader'

export interface HtlcInfo {
  incoming_timelock?: number
  outgoing_timelock?: number
  incoming_amt_msat?: number | string | Long
  outgoing_amt_msat?: number | string | Long
}

export interface HtlcInfo__Output {
  incoming_timelock: number
  outgoing_timelock: number
  incoming_amt_msat: string
  outgoing_amt_msat: string
}
