// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

// Original file: proto/cln/node.proto

export const _cln_ListfundsOutputs_ListfundsOutputsStatus = {
  UNCONFIRMED: 'UNCONFIRMED',
  CONFIRMED: 'CONFIRMED',
  SPENT: 'SPENT',
  IMMATURE: 'IMMATURE',
} as const

export type _cln_ListfundsOutputs_ListfundsOutputsStatus =
  | 'UNCONFIRMED'
  | 0
  | 'CONFIRMED'
  | 1
  | 'SPENT'
  | 2
  | 'IMMATURE'
  | 3

export type _cln_ListfundsOutputs_ListfundsOutputsStatus__Output =
  (typeof _cln_ListfundsOutputs_ListfundsOutputsStatus)[keyof typeof _cln_ListfundsOutputs_ListfundsOutputsStatus]

export interface ListfundsOutputs {
  txid?: Buffer | Uint8Array | string
  output?: number
  amount_msat?: _cln_Amount | null
  scriptpubkey?: Buffer | Uint8Array | string
  address?: string
  redeemscript?: Buffer | Uint8Array | string
  status?: _cln_ListfundsOutputs_ListfundsOutputsStatus
  blockheight?: number
  reserved?: boolean
  _address?: 'address'
  _redeemscript?: 'redeemscript'
  _blockheight?: 'blockheight'
}

export interface ListfundsOutputs__Output {
  txid: Buffer
  output: number
  amount_msat: _cln_Amount__Output | null
  scriptpubkey: Buffer
  address?: string
  redeemscript?: Buffer
  status: _cln_ListfundsOutputs_ListfundsOutputsStatus__Output
  blockheight?: number
  reserved: boolean
  _address: 'address'
  _redeemscript: 'redeemscript'
  _blockheight: 'blockheight'
}
