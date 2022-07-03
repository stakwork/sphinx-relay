// Original file: proto/lightning.proto

import type { ChannelBackups as _lnrpc_ChannelBackups, ChannelBackups__Output as _lnrpc_ChannelBackups__Output } from '../lnrpc/ChannelBackups';
import type { MultiChanBackup as _lnrpc_MultiChanBackup, MultiChanBackup__Output as _lnrpc_MultiChanBackup__Output } from '../lnrpc/MultiChanBackup';

export interface ChanBackupSnapshot {
  'single_chan_backups'?: (_lnrpc_ChannelBackups | null);
  'multi_chan_backup'?: (_lnrpc_MultiChanBackup | null);
}

export interface ChanBackupSnapshot__Output {
  'single_chan_backups': (_lnrpc_ChannelBackups__Output | null);
  'multi_chan_backup': (_lnrpc_MultiChanBackup__Output | null);
}
