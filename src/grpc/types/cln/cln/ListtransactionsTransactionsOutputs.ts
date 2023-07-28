// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

// Original file: proto/cln/node.proto

export const _cln_ListtransactionsTransactionsOutputs_ListtransactionsTransactionsOutputsType =
  {
    THEIRS: 'THEIRS',
    DEPOSIT: 'DEPOSIT',
    WITHDRAW: 'WITHDRAW',
    CHANNEL_FUNDING: 'CHANNEL_FUNDING',
    CHANNEL_MUTUAL_CLOSE: 'CHANNEL_MUTUAL_CLOSE',
    CHANNEL_UNILATERAL_CLOSE: 'CHANNEL_UNILATERAL_CLOSE',
    CHANNEL_SWEEP: 'CHANNEL_SWEEP',
    CHANNEL_HTLC_SUCCESS: 'CHANNEL_HTLC_SUCCESS',
    CHANNEL_HTLC_TIMEOUT: 'CHANNEL_HTLC_TIMEOUT',
    CHANNEL_PENALTY: 'CHANNEL_PENALTY',
    CHANNEL_UNILATERAL_CHEAT: 'CHANNEL_UNILATERAL_CHEAT',
  } as const

export type _cln_ListtransactionsTransactionsOutputs_ListtransactionsTransactionsOutputsType =

    | 'THEIRS'
    | 0
    | 'DEPOSIT'
    | 1
    | 'WITHDRAW'
    | 2
    | 'CHANNEL_FUNDING'
    | 3
    | 'CHANNEL_MUTUAL_CLOSE'
    | 4
    | 'CHANNEL_UNILATERAL_CLOSE'
    | 5
    | 'CHANNEL_SWEEP'
    | 6
    | 'CHANNEL_HTLC_SUCCESS'
    | 7
    | 'CHANNEL_HTLC_TIMEOUT'
    | 8
    | 'CHANNEL_PENALTY'
    | 9
    | 'CHANNEL_UNILATERAL_CHEAT'
    | 10

export type _cln_ListtransactionsTransactionsOutputs_ListtransactionsTransactionsOutputsType__Output =
  (typeof _cln_ListtransactionsTransactionsOutputs_ListtransactionsTransactionsOutputsType)[keyof typeof _cln_ListtransactionsTransactionsOutputs_ListtransactionsTransactionsOutputsType]

export interface ListtransactionsTransactionsOutputs {
  index?: number
  scriptPubKey?: Buffer | Uint8Array | string
  item_type?: _cln_ListtransactionsTransactionsOutputs_ListtransactionsTransactionsOutputsType
  channel?: string
  amount_msat?: _cln_Amount | null
  _item_type?: 'item_type'
  _channel?: 'channel'
}

export interface ListtransactionsTransactionsOutputs__Output {
  index: number
  scriptPubKey: Buffer
  item_type?: _cln_ListtransactionsTransactionsOutputs_ListtransactionsTransactionsOutputsType__Output
  channel?: string
  amount_msat: _cln_Amount__Output | null
  _item_type: 'item_type'
  _channel: 'channel'
}
