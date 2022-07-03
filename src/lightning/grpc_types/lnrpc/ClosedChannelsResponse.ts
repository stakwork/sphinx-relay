// Original file: proto/lightning.proto

import type { ChannelCloseSummary as _lnrpc_ChannelCloseSummary, ChannelCloseSummary__Output as _lnrpc_ChannelCloseSummary__Output } from '../lnrpc/ChannelCloseSummary';

export interface ClosedChannelsResponse {
  'channels'?: (_lnrpc_ChannelCloseSummary)[];
}

export interface ClosedChannelsResponse__Output {
  'channels': (_lnrpc_ChannelCloseSummary__Output)[];
}
