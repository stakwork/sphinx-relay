// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_ListsendpaysRequest_ListsendpaysStatus = {
  PENDING: 'PENDING',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED',
} as const

export type _cln_ListsendpaysRequest_ListsendpaysStatus =
  | 'PENDING'
  | 0
  | 'COMPLETE'
  | 1
  | 'FAILED'
  | 2

export type _cln_ListsendpaysRequest_ListsendpaysStatus__Output =
  (typeof _cln_ListsendpaysRequest_ListsendpaysStatus)[keyof typeof _cln_ListsendpaysRequest_ListsendpaysStatus]

export interface ListsendpaysRequest {
  bolt11?: string
  payment_hash?: Buffer | Uint8Array | string
  status?: _cln_ListsendpaysRequest_ListsendpaysStatus
  _bolt11?: 'bolt11'
  _payment_hash?: 'payment_hash'
  _status?: 'status'
}

export interface ListsendpaysRequest__Output {
  bolt11?: string
  payment_hash?: Buffer
  status?: _cln_ListsendpaysRequest_ListsendpaysStatus__Output
  _bolt11: 'bolt11'
  _payment_hash: 'payment_hash'
  _status: 'status'
}
