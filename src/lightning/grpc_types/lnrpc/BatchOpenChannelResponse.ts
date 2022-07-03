// Original file: proto/lightning.proto

import type { PendingUpdate as _lnrpc_PendingUpdate, PendingUpdate__Output as _lnrpc_PendingUpdate__Output } from '../lnrpc/PendingUpdate';

export interface BatchOpenChannelResponse {
  'pending_channels'?: (_lnrpc_PendingUpdate)[];
}

export interface BatchOpenChannelResponse__Output {
  'pending_channels': (_lnrpc_PendingUpdate__Output)[];
}
