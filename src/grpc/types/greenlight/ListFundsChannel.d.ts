// Original file: proto/greenlight.proto

import type { Long } from '@grpc/proto-loader'

export interface ListFundsChannel {
  peer_id?: Buffer | Uint8Array | string
  connected?: boolean
  short_channel_id?: number | string | Long
  our_amount_msat?: number | string | Long
  amount_msat?: number | string | Long
  funding_txid?: Buffer | Uint8Array | string
  funding_output?: number
}

export interface ListFundsChannel__Output {
  peer_id: Buffer
  connected: boolean
  short_channel_id: string
  our_amount_msat: string
  amount_msat: string
  funding_txid: Buffer
  funding_output: number
}
