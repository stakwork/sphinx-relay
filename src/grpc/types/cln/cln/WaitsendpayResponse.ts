// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'
import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

// Original file: proto/cln/node.proto

export const _cln_WaitsendpayResponse_WaitsendpayStatus = {
  COMPLETE: 'COMPLETE',
} as const

export type _cln_WaitsendpayResponse_WaitsendpayStatus = 'COMPLETE' | 0

export type _cln_WaitsendpayResponse_WaitsendpayStatus__Output =
  (typeof _cln_WaitsendpayResponse_WaitsendpayStatus)[keyof typeof _cln_WaitsendpayResponse_WaitsendpayStatus]

export interface WaitsendpayResponse {
  id?: number | string | Long
  groupid?: number | string | Long
  payment_hash?: Buffer | Uint8Array | string
  status?: _cln_WaitsendpayResponse_WaitsendpayStatus
  amount_msat?: _cln_Amount | null
  destination?: Buffer | Uint8Array | string
  created_at?: number | string | Long
  amount_sent_msat?: _cln_Amount | null
  label?: string
  partid?: number | string | Long
  bolt11?: string
  bolt12?: string
  payment_preimage?: Buffer | Uint8Array | string
  completed_at?: number | string
  _groupid?: 'groupid'
  _amount_msat?: 'amount_msat'
  _destination?: 'destination'
  _completed_at?: 'completed_at'
  _label?: 'label'
  _partid?: 'partid'
  _bolt11?: 'bolt11'
  _bolt12?: 'bolt12'
  _payment_preimage?: 'payment_preimage'
}

export interface WaitsendpayResponse__Output {
  id: string
  groupid?: string
  payment_hash: Buffer
  status: _cln_WaitsendpayResponse_WaitsendpayStatus__Output
  amount_msat?: _cln_Amount__Output | null
  destination?: Buffer
  created_at: string
  amount_sent_msat: _cln_Amount__Output | null
  label?: string
  partid?: string
  bolt11?: string
  bolt12?: string
  payment_preimage?: Buffer
  completed_at?: number
  _groupid: 'groupid'
  _amount_msat: 'amount_msat'
  _destination: 'destination'
  _completed_at: 'completed_at'
  _label: 'label'
  _partid: 'partid'
  _bolt11: 'bolt11'
  _bolt12: 'bolt12'
  _payment_preimage: 'payment_preimage'
}
