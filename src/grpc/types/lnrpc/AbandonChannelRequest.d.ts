// Original file: proto/lightning.proto

import type {
  ChannelPoint as _lnrpc_ChannelPoint,
  ChannelPoint__Output as _lnrpc_ChannelPoint__Output,
} from '../lnrpc/ChannelPoint'

export interface AbandonChannelRequest {
  channel_point?: _lnrpc_ChannelPoint | null
  pending_funding_shim_only?: boolean
  i_know_what_i_am_doing?: boolean
}

export interface AbandonChannelRequest__Output {
  channel_point: _lnrpc_ChannelPoint__Output | null
  pending_funding_shim_only: boolean
  i_know_what_i_am_doing: boolean
}
