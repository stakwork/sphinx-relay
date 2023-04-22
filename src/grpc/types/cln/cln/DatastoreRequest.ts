// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'

// Original file: proto/cln/node.proto

export const _cln_DatastoreRequest_DatastoreMode = {
  MUST_CREATE: 'MUST_CREATE',
  MUST_REPLACE: 'MUST_REPLACE',
  CREATE_OR_REPLACE: 'CREATE_OR_REPLACE',
  MUST_APPEND: 'MUST_APPEND',
  CREATE_OR_APPEND: 'CREATE_OR_APPEND',
} as const

export type _cln_DatastoreRequest_DatastoreMode =
  | 'MUST_CREATE'
  | 0
  | 'MUST_REPLACE'
  | 1
  | 'CREATE_OR_REPLACE'
  | 2
  | 'MUST_APPEND'
  | 3
  | 'CREATE_OR_APPEND'
  | 4

export type _cln_DatastoreRequest_DatastoreMode__Output =
  typeof _cln_DatastoreRequest_DatastoreMode[keyof typeof _cln_DatastoreRequest_DatastoreMode]

export interface DatastoreRequest {
  hex?: Buffer | Uint8Array | string
  mode?: _cln_DatastoreRequest_DatastoreMode
  generation?: number | string | Long
  key?: string[]
  string?: string
  _string?: 'string'
  _hex?: 'hex'
  _mode?: 'mode'
  _generation?: 'generation'
}

export interface DatastoreRequest__Output {
  hex?: Buffer
  mode?: _cln_DatastoreRequest_DatastoreMode__Output
  generation?: string
  key: string[]
  string?: string
  _string: 'string'
  _hex: 'hex'
  _mode: 'mode'
  _generation: 'generation'
}
