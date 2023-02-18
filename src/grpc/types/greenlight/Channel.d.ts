// Original file: proto/greenlight.proto

import type {
  Htlc as _greenlight_Htlc,
  Htlc__Output as _greenlight_Htlc__Output,
} from '../greenlight/Htlc'

export interface Channel {
  state?: string
  owner?: string
  short_channel_id?: string
  direction?: number
  channel_id?: string
  funding_txid?: string
  close_to_addr?: string
  close_to?: string
  private?: boolean
  total?: string
  dust_limit?: string
  spendable?: string
  receivable?: string
  their_to_self_delay?: number
  our_to_self_delay?: number
  status?: string[]
  htlcs?: _greenlight_Htlc[]
}

export interface Channel__Output {
  state: string
  owner: string
  short_channel_id: string
  direction: number
  channel_id: string
  funding_txid: string
  close_to_addr: string
  close_to: string
  private: boolean
  total: string
  dust_limit: string
  spendable: string
  receivable: string
  their_to_self_delay: number
  our_to_self_delay: number
  status: string[]
  htlcs: _greenlight_Htlc__Output[]
}
