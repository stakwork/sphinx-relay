// Original file: proto/lightning.proto

import type { ChannelPoint as _lnrpc_ChannelPoint, ChannelPoint__Output as _lnrpc_ChannelPoint__Output } from '../lnrpc/ChannelPoint';

export interface MultiChanBackup {
  'chan_points'?: (_lnrpc_ChannelPoint)[];
  'multi_chan_backup'?: (Buffer | Uint8Array | string);
}

export interface MultiChanBackup__Output {
  'chan_points': (_lnrpc_ChannelPoint__Output)[];
  'multi_chan_backup': (Buffer);
}
