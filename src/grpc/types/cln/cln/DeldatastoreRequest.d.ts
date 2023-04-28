// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'

export interface DeldatastoreRequest {
  generation?: number | string | Long
  key?: string[]
  _generation?: 'generation'
}

export interface DeldatastoreRequest__Output {
  generation?: string
  key: string[]
  _generation: 'generation'
}
