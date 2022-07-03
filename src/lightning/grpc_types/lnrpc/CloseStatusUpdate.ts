// Original file: proto/lightning.proto

import type { PendingUpdate as _lnrpc_PendingUpdate, PendingUpdate__Output as _lnrpc_PendingUpdate__Output } from '../lnrpc/PendingUpdate';
import type { ChannelCloseUpdate as _lnrpc_ChannelCloseUpdate, ChannelCloseUpdate__Output as _lnrpc_ChannelCloseUpdate__Output } from '../lnrpc/ChannelCloseUpdate';

export interface CloseStatusUpdate {
  'close_pending'?: (_lnrpc_PendingUpdate | null);
  'chan_close'?: (_lnrpc_ChannelCloseUpdate | null);
  'update'?: "close_pending"|"chan_close";
}

export interface CloseStatusUpdate__Output {
  'close_pending'?: (_lnrpc_PendingUpdate__Output | null);
  'chan_close'?: (_lnrpc_ChannelCloseUpdate__Output | null);
  'update': "close_pending"|"chan_close";
}
