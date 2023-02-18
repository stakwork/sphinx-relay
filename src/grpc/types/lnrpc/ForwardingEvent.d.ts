// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'

export interface ForwardingEvent {
  timestamp?: number | string | Long
  chan_id_in?: number | string | Long
  chan_id_out?: number | string | Long
  amt_in?: number | string | Long
  amt_out?: number | string | Long
  fee?: number | string | Long
  fee_msat?: number | string | Long
  amt_in_msat?: number | string | Long
  amt_out_msat?: number | string | Long
  timestamp_ns?: number | string | Long
  peer_alias_in?: string
  peer_alias_out?: string
}

export interface ForwardingEvent__Output {
  timestamp: string
  chan_id_in: string
  chan_id_out: string
  amt_in: string
  amt_out: string
  fee: string
  fee_msat: string
  amt_in_msat: string
  amt_out_msat: string
  timestamp_ns: string
  peer_alias_in: string
  peer_alias_out: string
}
