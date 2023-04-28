// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'

export interface DatastoreResponse {
  generation?: number | string | Long
  hex?: Buffer | Uint8Array | string
  string?: string
  key?: string[]
  _generation?: 'generation'
  _hex?: 'hex'
  _string?: 'string'
}

export interface DatastoreResponse__Output {
  generation?: string
  hex?: Buffer
  string?: string
  key: string[]
  _generation: 'generation'
  _hex: 'hex'
  _string: 'string'
}
