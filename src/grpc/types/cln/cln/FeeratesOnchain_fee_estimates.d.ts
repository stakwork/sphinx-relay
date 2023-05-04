// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'

export interface FeeratesOnchain_fee_estimates {
  opening_channel_satoshis?: number | string | Long
  mutual_close_satoshis?: number | string | Long
  unilateral_close_satoshis?: number | string | Long
  htlc_timeout_satoshis?: number | string | Long
  htlc_success_satoshis?: number | string | Long
}

export interface FeeratesOnchain_fee_estimates__Output {
  opening_channel_satoshis: string
  mutual_close_satoshis: string
  unilateral_close_satoshis: string
  htlc_timeout_satoshis: string
  htlc_success_satoshis: string
}
