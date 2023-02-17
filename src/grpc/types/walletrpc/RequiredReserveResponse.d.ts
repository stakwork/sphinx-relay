// Original file: proto/walletkit.proto

import type { Long } from '@grpc/proto-loader'

export interface RequiredReserveResponse {
  required_reserve?: number | string | Long
}

export interface RequiredReserveResponse__Output {
  required_reserve: string
}
