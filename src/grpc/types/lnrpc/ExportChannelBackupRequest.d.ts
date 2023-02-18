// Original file: proto/lightning.proto

import type {
  ChannelPoint as _lnrpc_ChannelPoint,
  ChannelPoint__Output as _lnrpc_ChannelPoint__Output,
} from '../lnrpc/ChannelPoint'

export interface ExportChannelBackupRequest {
  chan_point?: _lnrpc_ChannelPoint | null
}

export interface ExportChannelBackupRequest__Output {
  chan_point: _lnrpc_ChannelPoint__Output | null
}
