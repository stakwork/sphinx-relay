// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface SetchannelChannels {
  peer_id?: Buffer | Uint8Array | string
  channel_id?: Buffer | Uint8Array | string
  short_channel_id?: string
  fee_base_msat?: _cln_Amount | null
  fee_proportional_millionths?: number
  minimum_htlc_out_msat?: _cln_Amount | null
  warning_htlcmin_too_low?: string
  maximum_htlc_out_msat?: _cln_Amount | null
  warning_htlcmax_too_high?: string
  _short_channel_id?: 'short_channel_id'
  _warning_htlcmin_too_low?: 'warning_htlcmin_too_low'
  _warning_htlcmax_too_high?: 'warning_htlcmax_too_high'
}

export interface SetchannelChannels__Output {
  peer_id: Buffer
  channel_id: Buffer
  short_channel_id?: string
  fee_base_msat: _cln_Amount__Output | null
  fee_proportional_millionths: number
  minimum_htlc_out_msat: _cln_Amount__Output | null
  warning_htlcmin_too_low?: string
  maximum_htlc_out_msat: _cln_Amount__Output | null
  warning_htlcmax_too_high?: string
  _short_channel_id: 'short_channel_id'
  _warning_htlcmin_too_low: 'warning_htlcmin_too_low'
  _warning_htlcmax_too_high: 'warning_htlcmax_too_high'
}
