// Original file: proto/router.proto

import type {
  ForwardEvent as _routerrpc_ForwardEvent,
  ForwardEvent__Output as _routerrpc_ForwardEvent__Output,
} from '../routerrpc/ForwardEvent'
import type {
  ForwardFailEvent as _routerrpc_ForwardFailEvent,
  ForwardFailEvent__Output as _routerrpc_ForwardFailEvent__Output,
} from '../routerrpc/ForwardFailEvent'
import type {
  SettleEvent as _routerrpc_SettleEvent,
  SettleEvent__Output as _routerrpc_SettleEvent__Output,
} from '../routerrpc/SettleEvent'
import type {
  LinkFailEvent as _routerrpc_LinkFailEvent,
  LinkFailEvent__Output as _routerrpc_LinkFailEvent__Output,
} from '../routerrpc/LinkFailEvent'
import type {
  SubscribedEvent as _routerrpc_SubscribedEvent,
  SubscribedEvent__Output as _routerrpc_SubscribedEvent__Output,
} from '../routerrpc/SubscribedEvent'
import type {
  FinalHtlcEvent as _routerrpc_FinalHtlcEvent,
  FinalHtlcEvent__Output as _routerrpc_FinalHtlcEvent__Output,
} from '../routerrpc/FinalHtlcEvent'
import type { Long } from '@grpc/proto-loader'

// Original file: proto/router.proto

export const _routerrpc_HtlcEvent_EventType = {
  UNKNOWN: 'UNKNOWN',
  SEND: 'SEND',
  RECEIVE: 'RECEIVE',
  FORWARD: 'FORWARD',
} as const

export type _routerrpc_HtlcEvent_EventType =
  | 'UNKNOWN'
  | 0
  | 'SEND'
  | 1
  | 'RECEIVE'
  | 2
  | 'FORWARD'
  | 3

export type _routerrpc_HtlcEvent_EventType__Output =
  (typeof _routerrpc_HtlcEvent_EventType)[keyof typeof _routerrpc_HtlcEvent_EventType]

export interface HtlcEvent {
  incoming_channel_id?: number | string | Long
  outgoing_channel_id?: number | string | Long
  incoming_htlc_id?: number | string | Long
  outgoing_htlc_id?: number | string | Long
  timestamp_ns?: number | string | Long
  event_type?: _routerrpc_HtlcEvent_EventType
  forward_event?: _routerrpc_ForwardEvent | null
  forward_fail_event?: _routerrpc_ForwardFailEvent | null
  settle_event?: _routerrpc_SettleEvent | null
  link_fail_event?: _routerrpc_LinkFailEvent | null
  subscribed_event?: _routerrpc_SubscribedEvent | null
  final_htlc_event?: _routerrpc_FinalHtlcEvent | null
  event?:
    | 'forward_event'
    | 'forward_fail_event'
    | 'settle_event'
    | 'link_fail_event'
    | 'subscribed_event'
    | 'final_htlc_event'
}

export interface HtlcEvent__Output {
  incoming_channel_id: string
  outgoing_channel_id: string
  incoming_htlc_id: string
  outgoing_htlc_id: string
  timestamp_ns: string
  event_type: _routerrpc_HtlcEvent_EventType__Output
  forward_event?: _routerrpc_ForwardEvent__Output | null
  forward_fail_event?: _routerrpc_ForwardFailEvent__Output | null
  settle_event?: _routerrpc_SettleEvent__Output | null
  link_fail_event?: _routerrpc_LinkFailEvent__Output | null
  subscribed_event?: _routerrpc_SubscribedEvent__Output | null
  final_htlc_event?: _routerrpc_FinalHtlcEvent__Output | null
  event:
    | 'forward_event'
    | 'forward_fail_event'
    | 'settle_event'
    | 'link_fail_event'
    | 'subscribed_event'
    | 'final_htlc_event'
}
