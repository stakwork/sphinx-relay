// Original file: proto/cln/node.proto

import type {
  ListpeersPeersChannelsFeerate as _cln_ListpeersPeersChannelsFeerate,
  ListpeersPeersChannelsFeerate__Output as _cln_ListpeersPeersChannelsFeerate__Output,
} from '../cln/ListpeersPeersChannelsFeerate'
import type {
  ListpeersPeersChannelsInflight as _cln_ListpeersPeersChannelsInflight,
  ListpeersPeersChannelsInflight__Output as _cln_ListpeersPeersChannelsInflight__Output,
} from '../cln/ListpeersPeersChannelsInflight'
import type {
  ChannelSide as _cln_ChannelSide,
  ChannelSide__Output as _cln_ChannelSide__Output,
} from '../cln/ChannelSide'
import type {
  ListpeersPeersChannelsFunding as _cln_ListpeersPeersChannelsFunding,
  ListpeersPeersChannelsFunding__Output as _cln_ListpeersPeersChannelsFunding__Output,
} from '../cln/ListpeersPeersChannelsFunding'
import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type {
  ListpeersPeersChannelsHtlcs as _cln_ListpeersPeersChannelsHtlcs,
  ListpeersPeersChannelsHtlcs__Output as _cln_ListpeersPeersChannelsHtlcs__Output,
} from '../cln/ListpeersPeersChannelsHtlcs'
import type {
  ListpeersPeersChannelsAlias as _cln_ListpeersPeersChannelsAlias,
  ListpeersPeersChannelsAlias__Output as _cln_ListpeersPeersChannelsAlias__Output,
} from '../cln/ListpeersPeersChannelsAlias'
import type { Long } from '@grpc/proto-loader'

// Original file: proto/cln/node.proto

export const _cln_ListpeersPeersChannels_ListpeersPeersChannelsState = {
  OPENINGD: 'OPENINGD',
  CHANNELD_AWAITING_LOCKIN: 'CHANNELD_AWAITING_LOCKIN',
  CHANNELD_NORMAL: 'CHANNELD_NORMAL',
  CHANNELD_SHUTTING_DOWN: 'CHANNELD_SHUTTING_DOWN',
  CLOSINGD_SIGEXCHANGE: 'CLOSINGD_SIGEXCHANGE',
  CLOSINGD_COMPLETE: 'CLOSINGD_COMPLETE',
  AWAITING_UNILATERAL: 'AWAITING_UNILATERAL',
  FUNDING_SPEND_SEEN: 'FUNDING_SPEND_SEEN',
  ONCHAIN: 'ONCHAIN',
  DUALOPEND_OPEN_INIT: 'DUALOPEND_OPEN_INIT',
  DUALOPEND_AWAITING_LOCKIN: 'DUALOPEND_AWAITING_LOCKIN',
} as const

export type _cln_ListpeersPeersChannels_ListpeersPeersChannelsState =
  | 'OPENINGD'
  | 0
  | 'CHANNELD_AWAITING_LOCKIN'
  | 1
  | 'CHANNELD_NORMAL'
  | 2
  | 'CHANNELD_SHUTTING_DOWN'
  | 3
  | 'CLOSINGD_SIGEXCHANGE'
  | 4
  | 'CLOSINGD_COMPLETE'
  | 5
  | 'AWAITING_UNILATERAL'
  | 6
  | 'FUNDING_SPEND_SEEN'
  | 7
  | 'ONCHAIN'
  | 8
  | 'DUALOPEND_OPEN_INIT'
  | 9
  | 'DUALOPEND_AWAITING_LOCKIN'
  | 10

export type _cln_ListpeersPeersChannels_ListpeersPeersChannelsState__Output =
  (typeof _cln_ListpeersPeersChannels_ListpeersPeersChannelsState)[keyof typeof _cln_ListpeersPeersChannels_ListpeersPeersChannelsState]

export interface ListpeersPeersChannels {
  state?: _cln_ListpeersPeersChannels_ListpeersPeersChannelsState
  scratch_txid?: Buffer | Uint8Array | string
  feerate?: _cln_ListpeersPeersChannelsFeerate | null
  owner?: string
  short_channel_id?: string
  channel_id?: Buffer | Uint8Array | string
  funding_txid?: Buffer | Uint8Array | string
  funding_outnum?: number
  initial_feerate?: string
  last_feerate?: string
  next_feerate?: string
  next_fee_step?: number
  inflight?: _cln_ListpeersPeersChannelsInflight[]
  close_to?: Buffer | Uint8Array | string
  private?: boolean
  opener?: _cln_ChannelSide
  closer?: _cln_ChannelSide
  features?: string[]
  funding?: _cln_ListpeersPeersChannelsFunding | null
  to_us_msat?: _cln_Amount | null
  min_to_us_msat?: _cln_Amount | null
  max_to_us_msat?: _cln_Amount | null
  total_msat?: _cln_Amount | null
  fee_base_msat?: _cln_Amount | null
  fee_proportional_millionths?: number
  dust_limit_msat?: _cln_Amount | null
  max_total_htlc_in_msat?: _cln_Amount | null
  their_reserve_msat?: _cln_Amount | null
  our_reserve_msat?: _cln_Amount | null
  spendable_msat?: _cln_Amount | null
  receivable_msat?: _cln_Amount | null
  minimum_htlc_in_msat?: _cln_Amount | null
  their_to_self_delay?: number
  our_to_self_delay?: number
  max_accepted_htlcs?: number
  status?: string[]
  in_payments_offered?: number | string | Long
  in_offered_msat?: _cln_Amount | null
  in_payments_fulfilled?: number | string | Long
  in_fulfilled_msat?: _cln_Amount | null
  out_payments_offered?: number | string | Long
  out_offered_msat?: _cln_Amount | null
  out_payments_fulfilled?: number | string | Long
  out_fulfilled_msat?: _cln_Amount | null
  htlcs?: _cln_ListpeersPeersChannelsHtlcs[]
  close_to_addr?: string
  minimum_htlc_out_msat?: _cln_Amount | null
  maximum_htlc_out_msat?: _cln_Amount | null
  alias?: _cln_ListpeersPeersChannelsAlias | null
  _scratch_txid?: 'scratch_txid'
  _feerate?: 'feerate'
  _owner?: 'owner'
  _short_channel_id?: 'short_channel_id'
  _channel_id?: 'channel_id'
  _funding_txid?: 'funding_txid'
  _funding_outnum?: 'funding_outnum'
  _initial_feerate?: 'initial_feerate'
  _last_feerate?: 'last_feerate'
  _next_feerate?: 'next_feerate'
  _next_fee_step?: 'next_fee_step'
  _close_to?: 'close_to'
  _private?: 'private'
  _closer?: 'closer'
  _funding?: 'funding'
  _to_us_msat?: 'to_us_msat'
  _min_to_us_msat?: 'min_to_us_msat'
  _max_to_us_msat?: 'max_to_us_msat'
  _total_msat?: 'total_msat'
  _fee_base_msat?: 'fee_base_msat'
  _fee_proportional_millionths?: 'fee_proportional_millionths'
  _dust_limit_msat?: 'dust_limit_msat'
  _max_total_htlc_in_msat?: 'max_total_htlc_in_msat'
  _their_reserve_msat?: 'their_reserve_msat'
  _our_reserve_msat?: 'our_reserve_msat'
  _spendable_msat?: 'spendable_msat'
  _receivable_msat?: 'receivable_msat'
  _minimum_htlc_in_msat?: 'minimum_htlc_in_msat'
  _minimum_htlc_out_msat?: 'minimum_htlc_out_msat'
  _maximum_htlc_out_msat?: 'maximum_htlc_out_msat'
  _their_to_self_delay?: 'their_to_self_delay'
  _our_to_self_delay?: 'our_to_self_delay'
  _max_accepted_htlcs?: 'max_accepted_htlcs'
  _alias?: 'alias'
  _in_payments_offered?: 'in_payments_offered'
  _in_offered_msat?: 'in_offered_msat'
  _in_payments_fulfilled?: 'in_payments_fulfilled'
  _in_fulfilled_msat?: 'in_fulfilled_msat'
  _out_payments_offered?: 'out_payments_offered'
  _out_offered_msat?: 'out_offered_msat'
  _out_payments_fulfilled?: 'out_payments_fulfilled'
  _out_fulfilled_msat?: 'out_fulfilled_msat'
  _close_to_addr?: 'close_to_addr'
}

export interface ListpeersPeersChannels__Output {
  state: _cln_ListpeersPeersChannels_ListpeersPeersChannelsState__Output
  scratch_txid?: Buffer
  feerate?: _cln_ListpeersPeersChannelsFeerate__Output | null
  owner?: string
  short_channel_id?: string
  channel_id?: Buffer
  funding_txid?: Buffer
  funding_outnum?: number
  initial_feerate?: string
  last_feerate?: string
  next_feerate?: string
  next_fee_step?: number
  inflight: _cln_ListpeersPeersChannelsInflight__Output[]
  close_to?: Buffer
  private?: boolean
  opener: _cln_ChannelSide__Output
  closer?: _cln_ChannelSide__Output
  features: string[]
  funding?: _cln_ListpeersPeersChannelsFunding__Output | null
  to_us_msat?: _cln_Amount__Output | null
  min_to_us_msat?: _cln_Amount__Output | null
  max_to_us_msat?: _cln_Amount__Output | null
  total_msat?: _cln_Amount__Output | null
  fee_base_msat?: _cln_Amount__Output | null
  fee_proportional_millionths?: number
  dust_limit_msat?: _cln_Amount__Output | null
  max_total_htlc_in_msat?: _cln_Amount__Output | null
  their_reserve_msat?: _cln_Amount__Output | null
  our_reserve_msat?: _cln_Amount__Output | null
  spendable_msat?: _cln_Amount__Output | null
  receivable_msat?: _cln_Amount__Output | null
  minimum_htlc_in_msat?: _cln_Amount__Output | null
  their_to_self_delay?: number
  our_to_self_delay?: number
  max_accepted_htlcs?: number
  status: string[]
  in_payments_offered?: string
  in_offered_msat?: _cln_Amount__Output | null
  in_payments_fulfilled?: string
  in_fulfilled_msat?: _cln_Amount__Output | null
  out_payments_offered?: string
  out_offered_msat?: _cln_Amount__Output | null
  out_payments_fulfilled?: string
  out_fulfilled_msat?: _cln_Amount__Output | null
  htlcs: _cln_ListpeersPeersChannelsHtlcs__Output[]
  close_to_addr?: string
  minimum_htlc_out_msat?: _cln_Amount__Output | null
  maximum_htlc_out_msat?: _cln_Amount__Output | null
  alias?: _cln_ListpeersPeersChannelsAlias__Output | null
  _scratch_txid: 'scratch_txid'
  _feerate: 'feerate'
  _owner: 'owner'
  _short_channel_id: 'short_channel_id'
  _channel_id: 'channel_id'
  _funding_txid: 'funding_txid'
  _funding_outnum: 'funding_outnum'
  _initial_feerate: 'initial_feerate'
  _last_feerate: 'last_feerate'
  _next_feerate: 'next_feerate'
  _next_fee_step: 'next_fee_step'
  _close_to: 'close_to'
  _private: 'private'
  _closer: 'closer'
  _funding: 'funding'
  _to_us_msat: 'to_us_msat'
  _min_to_us_msat: 'min_to_us_msat'
  _max_to_us_msat: 'max_to_us_msat'
  _total_msat: 'total_msat'
  _fee_base_msat: 'fee_base_msat'
  _fee_proportional_millionths: 'fee_proportional_millionths'
  _dust_limit_msat: 'dust_limit_msat'
  _max_total_htlc_in_msat: 'max_total_htlc_in_msat'
  _their_reserve_msat: 'their_reserve_msat'
  _our_reserve_msat: 'our_reserve_msat'
  _spendable_msat: 'spendable_msat'
  _receivable_msat: 'receivable_msat'
  _minimum_htlc_in_msat: 'minimum_htlc_in_msat'
  _minimum_htlc_out_msat: 'minimum_htlc_out_msat'
  _maximum_htlc_out_msat: 'maximum_htlc_out_msat'
  _their_to_self_delay: 'their_to_self_delay'
  _our_to_self_delay: 'our_to_self_delay'
  _max_accepted_htlcs: 'max_accepted_htlcs'
  _alias: 'alias'
  _in_payments_offered: 'in_payments_offered'
  _in_offered_msat: 'in_offered_msat'
  _in_payments_fulfilled: 'in_payments_fulfilled'
  _in_fulfilled_msat: 'in_fulfilled_msat'
  _out_payments_offered: 'out_payments_offered'
  _out_offered_msat: 'out_offered_msat'
  _out_payments_fulfilled: 'out_payments_fulfilled'
  _out_fulfilled_msat: 'out_fulfilled_msat'
  _close_to_addr: 'close_to_addr'
}
