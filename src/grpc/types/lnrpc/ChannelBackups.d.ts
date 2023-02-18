// Original file: proto/lightning.proto

import type {
  ChannelBackup as _lnrpc_ChannelBackup,
  ChannelBackup__Output as _lnrpc_ChannelBackup__Output,
} from '../lnrpc/ChannelBackup'

export interface ChannelBackups {
  chan_backups?: _lnrpc_ChannelBackup[]
}

export interface ChannelBackups__Output {
  chan_backups: _lnrpc_ChannelBackup__Output[]
}
