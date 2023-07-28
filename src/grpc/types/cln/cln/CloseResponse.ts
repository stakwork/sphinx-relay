// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_CloseResponse_CloseType = {
  MUTUAL: 'MUTUAL',
  UNILATERAL: 'UNILATERAL',
  UNOPENED: 'UNOPENED',
} as const

export type _cln_CloseResponse_CloseType =
  | 'MUTUAL'
  | 0
  | 'UNILATERAL'
  | 1
  | 'UNOPENED'
  | 2

export type _cln_CloseResponse_CloseType__Output =
  (typeof _cln_CloseResponse_CloseType)[keyof typeof _cln_CloseResponse_CloseType]

export interface CloseResponse {
  item_type?: _cln_CloseResponse_CloseType
  tx?: Buffer | Uint8Array | string
  txid?: Buffer | Uint8Array | string
  _tx?: 'tx'
  _txid?: 'txid'
}

export interface CloseResponse__Output {
  item_type: _cln_CloseResponse_CloseType__Output
  tx?: Buffer
  txid?: Buffer
  _tx: 'tx'
  _txid: 'txid'
}
