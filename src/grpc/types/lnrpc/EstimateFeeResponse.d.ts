// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'

export interface EstimateFeeResponse {
  fee_sat?: number | string | Long
  feerate_sat_per_byte?: number | string | Long
  sat_per_vbyte?: number | string | Long
}

export interface EstimateFeeResponse__Output {
  fee_sat: string
  feerate_sat_per_byte: string
  sat_per_vbyte: string
}
