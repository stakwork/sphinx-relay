// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'

// Original file: proto/cln/node.proto

export const _cln_ListpaysPays_ListpaysPaysStatus = {
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  COMPLETE: 'COMPLETE',
} as const

export type _cln_ListpaysPays_ListpaysPaysStatus =
  | 'PENDING'
  | 0
  | 'FAILED'
  | 1
  | 'COMPLETE'
  | 2

export type _cln_ListpaysPays_ListpaysPaysStatus__Output =
  typeof _cln_ListpaysPays_ListpaysPaysStatus[keyof typeof _cln_ListpaysPays_ListpaysPaysStatus]

export interface ListpaysPays {
  payment_hash?: Buffer | Uint8Array | string
  status?: _cln_ListpaysPays_ListpaysPaysStatus
  destination?: Buffer | Uint8Array | string
  created_at?: number | string | Long
  label?: string
  bolt11?: string
  bolt12?: string
  erroronion?: Buffer | Uint8Array | string
  description?: string
  completed_at?: number | string | Long
  preimage?: Buffer | Uint8Array | string
  number_of_parts?: number | string | Long
  _destination?: 'destination'
  _completed_at?: 'completed_at'
  _label?: 'label'
  _bolt11?: 'bolt11'
  _description?: 'description'
  _bolt12?: 'bolt12'
  _preimage?: 'preimage'
  _number_of_parts?: 'number_of_parts'
  _erroronion?: 'erroronion'
}

export interface ListpaysPays__Output {
  payment_hash: Buffer
  status: _cln_ListpaysPays_ListpaysPaysStatus__Output
  destination?: Buffer
  created_at: string
  label?: string
  bolt11?: string
  bolt12?: string
  erroronion?: Buffer
  description?: string
  completed_at?: string
  preimage?: Buffer
  number_of_parts?: string
  _destination: 'destination'
  _completed_at: 'completed_at'
  _label: 'label'
  _bolt11: 'bolt11'
  _description: 'description'
  _bolt12: 'bolt12'
  _preimage: 'preimage'
  _number_of_parts: 'number_of_parts'
  _erroronion: 'erroronion'
}
