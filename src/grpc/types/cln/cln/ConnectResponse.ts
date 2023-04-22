// Original file: proto/cln/node.proto

import type {
  ConnectAddress as _cln_ConnectAddress,
  ConnectAddress__Output as _cln_ConnectAddress__Output,
} from '../cln/ConnectAddress'

// Original file: proto/cln/node.proto

export const _cln_ConnectResponse_ConnectDirection = {
  IN: 'IN',
  OUT: 'OUT',
} as const

export type _cln_ConnectResponse_ConnectDirection = 'IN' | 0 | 'OUT' | 1

export type _cln_ConnectResponse_ConnectDirection__Output =
  typeof _cln_ConnectResponse_ConnectDirection[keyof typeof _cln_ConnectResponse_ConnectDirection]

export interface ConnectResponse {
  id?: Buffer | Uint8Array | string
  features?: Buffer | Uint8Array | string
  direction?: _cln_ConnectResponse_ConnectDirection
  address?: _cln_ConnectAddress | null
}

export interface ConnectResponse__Output {
  id: Buffer
  features: Buffer
  direction: _cln_ConnectResponse_ConnectDirection__Output
  address: _cln_ConnectAddress__Output | null
}
