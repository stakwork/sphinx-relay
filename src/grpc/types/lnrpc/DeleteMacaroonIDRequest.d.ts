// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'

export interface DeleteMacaroonIDRequest {
  root_key_id?: number | string | Long
}

export interface DeleteMacaroonIDRequest__Output {
  root_key_id: string
}
