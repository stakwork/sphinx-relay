// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'

export interface DelexpiredinvoiceRequest {
  maxexpirytime?: number | string | Long
  _maxexpirytime?: 'maxexpirytime'
}

export interface DelexpiredinvoiceRequest__Output {
  maxexpirytime?: string
  _maxexpirytime: 'maxexpirytime'
}
