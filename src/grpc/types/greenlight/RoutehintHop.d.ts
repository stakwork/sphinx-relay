// Original file: proto/greenlight.proto

import type { Long } from '@grpc/proto-loader'

export interface RoutehintHop {
  node_id?: Buffer | Uint8Array | string
  short_channel_id?: string
  fee_base?: number | string | Long
  fee_prop?: number
  cltv_expiry_delta?: number
}

export interface RoutehintHop__Output {
  node_id: Buffer
  short_channel_id: string
  fee_base: string
  fee_prop: number
  cltv_expiry_delta: number
}
