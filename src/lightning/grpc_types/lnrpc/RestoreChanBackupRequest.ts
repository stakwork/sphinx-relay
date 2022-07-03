// Original file: proto/lightning.proto

import type { ChannelBackups as _lnrpc_ChannelBackups, ChannelBackups__Output as _lnrpc_ChannelBackups__Output } from '../lnrpc/ChannelBackups';

export interface RestoreChanBackupRequest {
  'chan_backups'?: (_lnrpc_ChannelBackups | null);
  'multi_chan_backup'?: (Buffer | Uint8Array | string);
  'backup'?: "chan_backups"|"multi_chan_backup";
}

export interface RestoreChanBackupRequest__Output {
  'chan_backups'?: (_lnrpc_ChannelBackups__Output | null);
  'multi_chan_backup'?: (Buffer);
  'backup': "chan_backups"|"multi_chan_backup";
}
