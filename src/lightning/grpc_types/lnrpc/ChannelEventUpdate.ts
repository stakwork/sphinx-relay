// Original file: proto/lightning.proto

import type { Channel as _lnrpc_Channel, Channel__Output as _lnrpc_Channel__Output } from '../lnrpc/Channel';
import type { ChannelCloseSummary as _lnrpc_ChannelCloseSummary, ChannelCloseSummary__Output as _lnrpc_ChannelCloseSummary__Output } from '../lnrpc/ChannelCloseSummary';
import type { ChannelPoint as _lnrpc_ChannelPoint, ChannelPoint__Output as _lnrpc_ChannelPoint__Output } from '../lnrpc/ChannelPoint';
import type { PendingUpdate as _lnrpc_PendingUpdate, PendingUpdate__Output as _lnrpc_PendingUpdate__Output } from '../lnrpc/PendingUpdate';

// Original file: proto/lightning.proto

export enum _lnrpc_ChannelEventUpdate_UpdateType {
  OPEN_CHANNEL = 0,
  CLOSED_CHANNEL = 1,
  ACTIVE_CHANNEL = 2,
  INACTIVE_CHANNEL = 3,
  PENDING_OPEN_CHANNEL = 4,
  FULLY_RESOLVED_CHANNEL = 5,
}

export interface ChannelEventUpdate {
  'open_channel'?: (_lnrpc_Channel | null);
  'closed_channel'?: (_lnrpc_ChannelCloseSummary | null);
  'active_channel'?: (_lnrpc_ChannelPoint | null);
  'inactive_channel'?: (_lnrpc_ChannelPoint | null);
  'type'?: (_lnrpc_ChannelEventUpdate_UpdateType | keyof typeof _lnrpc_ChannelEventUpdate_UpdateType);
  'pending_open_channel'?: (_lnrpc_PendingUpdate | null);
  'fully_resolved_channel'?: (_lnrpc_ChannelPoint | null);
  'channel'?: "open_channel"|"closed_channel"|"active_channel"|"inactive_channel"|"pending_open_channel"|"fully_resolved_channel";
}

export interface ChannelEventUpdate__Output {
  'open_channel'?: (_lnrpc_Channel__Output | null);
  'closed_channel'?: (_lnrpc_ChannelCloseSummary__Output | null);
  'active_channel'?: (_lnrpc_ChannelPoint__Output | null);
  'inactive_channel'?: (_lnrpc_ChannelPoint__Output | null);
  'type': (keyof typeof _lnrpc_ChannelEventUpdate_UpdateType);
  'pending_open_channel'?: (_lnrpc_PendingUpdate__Output | null);
  'fully_resolved_channel'?: (_lnrpc_ChannelPoint__Output | null);
  'channel': "open_channel"|"closed_channel"|"active_channel"|"inactive_channel"|"pending_open_channel"|"fully_resolved_channel";
}
