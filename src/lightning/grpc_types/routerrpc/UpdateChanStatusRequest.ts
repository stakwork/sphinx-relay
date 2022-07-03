// Original file: proto/router.proto

import type { ChannelPoint as _lnrpc_ChannelPoint, ChannelPoint__Output as _lnrpc_ChannelPoint__Output } from '../lnrpc/ChannelPoint';
import type { ChanStatusAction as _routerrpc_ChanStatusAction } from '../routerrpc/ChanStatusAction';

export interface UpdateChanStatusRequest {
  'chan_point'?: (_lnrpc_ChannelPoint | null);
  'action'?: (_routerrpc_ChanStatusAction | keyof typeof _routerrpc_ChanStatusAction);
}

export interface UpdateChanStatusRequest__Output {
  'chan_point': (_lnrpc_ChannelPoint__Output | null);
  'action': (keyof typeof _routerrpc_ChanStatusAction);
}
