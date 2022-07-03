// Original file: proto/lightning.proto

import type { ChannelPoint as _lnrpc_ChannelPoint, ChannelPoint__Output as _lnrpc_ChannelPoint__Output } from '../lnrpc/ChannelPoint';

export interface ChannelBackup {
  'chan_point'?: (_lnrpc_ChannelPoint | null);
  'chan_backup'?: (Buffer | Uint8Array | string);
}

export interface ChannelBackup__Output {
  'chan_point': (_lnrpc_ChannelPoint__Output | null);
  'chan_backup': (Buffer);
}
