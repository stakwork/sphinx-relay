// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'

export interface ListdatastoreDatastore {
  key?: string[]
  generation?: number | string | Long
  hex?: Buffer | Uint8Array | string
  string?: string
  _generation?: 'generation'
  _hex?: 'hex'
  _string?: 'string'
}

export interface ListdatastoreDatastore__Output {
  key: string[]
  generation?: string
  hex?: Buffer
  string?: string
  _generation: 'generation'
  _hex: 'hex'
  _string: 'string'
}
