// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type {
  ChannelState as _cln_ChannelState,
  ChannelState__Output as _cln_ChannelState__Output,
} from '../cln/ChannelState'

export interface ListfundsChannels {
  peer_id?: Buffer | Uint8Array | string
  our_amount_msat?: _cln_Amount | null
  amount_msat?: _cln_Amount | null
  funding_txid?: Buffer | Uint8Array | string
  funding_output?: number
  connected?: boolean
  state?: _cln_ChannelState
  short_channel_id?: string
  channel_id?: Buffer | Uint8Array | string
  _channel_id?: 'channel_id'
  _short_channel_id?: 'short_channel_id'
}

export interface ListfundsChannels__Output {
  peer_id: Buffer
  our_amount_msat: _cln_Amount__Output | null
  amount_msat: _cln_Amount__Output | null
  funding_txid: Buffer
  funding_output: number
  connected: boolean
  state: _cln_ChannelState__Output
  short_channel_id?: string
  channel_id?: Buffer
  _channel_id: 'channel_id'
  _short_channel_id: 'short_channel_id'
}
