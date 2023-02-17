// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'

export interface ChannelConstraints {
  csv_delay?: number
  chan_reserve_sat?: number | string | Long
  dust_limit_sat?: number | string | Long
  max_pending_amt_msat?: number | string | Long
  min_htlc_msat?: number | string | Long
  max_accepted_htlcs?: number
}

export interface ChannelConstraints__Output {
  csv_delay: number
  chan_reserve_sat: string
  dust_limit_sat: string
  max_pending_amt_msat: string
  min_htlc_msat: string
  max_accepted_htlcs: number
}
