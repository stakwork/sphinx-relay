// Original file: proto/rpc_proxy.proto

import type { Channel as _lnrpc_proxy_Channel, Channel__Output as _lnrpc_proxy_Channel__Output } from '../lnrpc_proxy/Channel';

export interface ListChannelsResponse {
  'channels'?: (_lnrpc_proxy_Channel)[];
}

export interface ListChannelsResponse__Output {
  'channels': (_lnrpc_proxy_Channel__Output)[];
}
