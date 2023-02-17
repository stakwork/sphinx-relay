// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'

export interface LookupHtlcRequest {
  chan_id?: number | string | Long
  htlc_index?: number | string | Long
}

export interface LookupHtlcRequest__Output {
  chan_id: string
  htlc_index: string
}
