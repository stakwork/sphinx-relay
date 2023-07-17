// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'
import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

// Original file: proto/cln/node.proto

export const _cln_SendonionResponse_SendonionStatus = {
  PENDING: 'PENDING',
  COMPLETE: 'COMPLETE',
} as const

export type _cln_SendonionResponse_SendonionStatus =
  | 'PENDING'
  | 0
  | 'COMPLETE'
  | 1

export type _cln_SendonionResponse_SendonionStatus__Output =
  typeof _cln_SendonionResponse_SendonionStatus[keyof typeof _cln_SendonionResponse_SendonionStatus]

export interface SendonionResponse {
  id?: number | string | Long
  payment_hash?: Buffer | Uint8Array | string
  status?: _cln_SendonionResponse_SendonionStatus
  amount_msat?: _cln_Amount | null
  destination?: Buffer | Uint8Array | string
  created_at?: number | string | Long
  amount_sent_msat?: _cln_Amount | null
  label?: string
  bolt11?: string
  bolt12?: string
  payment_preimage?: Buffer | Uint8Array | string
  message?: string
  partid?: number | string | Long
  _amount_msat?: 'amount_msat'
  _destination?: 'destination'
  _label?: 'label'
  _bolt11?: 'bolt11'
  _bolt12?: 'bolt12'
  _partid?: 'partid'
  _payment_preimage?: 'payment_preimage'
  _message?: 'message'
}

export interface SendonionResponse__Output {
  id: string
  payment_hash: Buffer
  status: _cln_SendonionResponse_SendonionStatus__Output
  amount_msat?: _cln_Amount__Output | null
  destination?: Buffer
  created_at: string
  amount_sent_msat: _cln_Amount__Output | null
  label?: string
  bolt11?: string
  bolt12?: string
  payment_preimage?: Buffer
  message?: string
  partid?: string
  _amount_msat: 'amount_msat'
  _destination: 'destination'
  _label: 'label'
  _bolt11: 'bolt11'
  _bolt12: 'bolt12'
  _partid: 'partid'
  _payment_preimage: 'payment_preimage'
  _message: 'message'
}
