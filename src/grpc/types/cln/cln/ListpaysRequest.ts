// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_ListpaysRequest_ListpaysStatus = {
  PENDING: 'PENDING',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED',
} as const

export type _cln_ListpaysRequest_ListpaysStatus =
  | 'PENDING'
  | 0
  | 'COMPLETE'
  | 1
  | 'FAILED'
  | 2

export type _cln_ListpaysRequest_ListpaysStatus__Output =
  typeof _cln_ListpaysRequest_ListpaysStatus[keyof typeof _cln_ListpaysRequest_ListpaysStatus]

export interface ListpaysRequest {
  bolt11?: string
  payment_hash?: Buffer | Uint8Array | string
  status?: _cln_ListpaysRequest_ListpaysStatus
  _bolt11?: 'bolt11'
  _payment_hash?: 'payment_hash'
  _status?: 'status'
}

export interface ListpaysRequest__Output {
  bolt11?: string
  payment_hash?: Buffer
  status?: _cln_ListpaysRequest_ListpaysStatus__Output
  _bolt11: 'bolt11'
  _payment_hash: 'payment_hash'
  _status: 'status'
}
