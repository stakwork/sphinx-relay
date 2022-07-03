// Original file: proto/lightning.proto

import type { Channel as _lnrpc_Channel, Channel__Output as _lnrpc_Channel__Output } from '../lnrpc/Channel';

export interface ListChannelsResponse {
  'channels'?: (_lnrpc_Channel)[];
}

export interface ListChannelsResponse__Output {
  'channels': (_lnrpc_Channel__Output)[];
}
