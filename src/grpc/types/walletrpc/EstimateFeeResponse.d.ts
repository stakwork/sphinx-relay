// Original file: proto/walletkit.proto

import type { Long } from '@grpc/proto-loader'

export interface EstimateFeeResponse {
  sat_per_kw?: number | string | Long
}

export interface EstimateFeeResponse__Output {
  sat_per_kw: string
}
