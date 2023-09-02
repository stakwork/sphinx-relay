// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_ListtransactionsTransactionsInputs_ListtransactionsTransactionsInputsType =
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

export type _cln_ListtransactionsTransactionsInputs_ListtransactionsTransactionsInputsType =

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

export type _cln_ListtransactionsTransactionsInputs_ListtransactionsTransactionsInputsType__Output =
  (typeof _cln_ListtransactionsTransactionsInputs_ListtransactionsTransactionsInputsType)[keyof typeof _cln_ListtransactionsTransactionsInputs_ListtransactionsTransactionsInputsType]

export interface ListtransactionsTransactionsInputs {
  txid?: Buffer | Uint8Array | string
  index?: number
  sequence?: number
  item_type?: _cln_ListtransactionsTransactionsInputs_ListtransactionsTransactionsInputsType
  channel?: string
  _item_type?: 'item_type'
  _channel?: 'channel'
}

export interface ListtransactionsTransactionsInputs__Output {
  txid: Buffer
  index: number
  sequence: number
  item_type?: _cln_ListtransactionsTransactionsInputs_ListtransactionsTransactionsInputsType__Output
  channel?: string
  _item_type: 'item_type'
  _channel: 'channel'
}
