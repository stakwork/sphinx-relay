// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface ListchannelsChannels {
  source?: Buffer | Uint8Array | string
  destination?: Buffer | Uint8Array | string
  short_channel_id?: string
  public?: boolean
  amount_msat?: _cln_Amount | null
  message_flags?: number
  channel_flags?: number
  active?: boolean
  last_update?: number
  base_fee_millisatoshi?: number
  fee_per_millionth?: number
  delay?: number
  htlc_minimum_msat?: _cln_Amount | null
  htlc_maximum_msat?: _cln_Amount | null
  features?: Buffer | Uint8Array | string
  direction?: number
  _htlc_maximum_msat?: 'htlc_maximum_msat'
}

export interface ListchannelsChannels__Output {
  source: Buffer
  destination: Buffer
  short_channel_id: string
  public: boolean
  amount_msat: _cln_Amount__Output | null
  message_flags: number
  channel_flags: number
  active: boolean
  last_update: number
  base_fee_millisatoshi: number
  fee_per_millionth: number
  delay: number
  htlc_minimum_msat: _cln_Amount__Output | null
  htlc_maximum_msat?: _cln_Amount__Output | null
  features: Buffer
  direction: number
  _htlc_maximum_msat: 'htlc_maximum_msat'
}
