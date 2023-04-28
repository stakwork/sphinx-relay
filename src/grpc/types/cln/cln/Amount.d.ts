// Original file: proto/cln/primitives.proto

import type { Long } from '@grpc/proto-loader'

export interface Amount {
  msat?: number | string | Long
}

export interface Amount__Output {
  msat: string
}
