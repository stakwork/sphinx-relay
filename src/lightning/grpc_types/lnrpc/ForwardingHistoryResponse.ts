// Original file: proto/lightning.proto

import type { ForwardingEvent as _lnrpc_ForwardingEvent, ForwardingEvent__Output as _lnrpc_ForwardingEvent__Output } from '../lnrpc/ForwardingEvent';

export interface ForwardingHistoryResponse {
  'forwarding_events'?: (_lnrpc_ForwardingEvent)[];
  'last_offset_index'?: (number);
}

export interface ForwardingHistoryResponse__Output {
  'forwarding_events': (_lnrpc_ForwardingEvent__Output)[];
  'last_offset_index': (number);
}
