// Original file: proto/router.proto

import type {
  ChannelPoint as _lnrpc_ChannelPoint,
  ChannelPoint__Output as _lnrpc_ChannelPoint__Output,
} from '../lnrpc/ChannelPoint'
import type {
  ChanStatusAction as _routerrpc_ChanStatusAction,
  ChanStatusAction__Output as _routerrpc_ChanStatusAction__Output,
} from '../routerrpc/ChanStatusAction'

export interface UpdateChanStatusRequest {
  chan_point?: _lnrpc_ChannelPoint | null
  action?: _routerrpc_ChanStatusAction
}

export interface UpdateChanStatusRequest__Output {
  chan_point: _lnrpc_ChannelPoint__Output | null
  action: _routerrpc_ChanStatusAction__Output
}
