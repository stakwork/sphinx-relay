// Original file: proto/router.proto

import type { ForwardEvent as _routerrpc_ForwardEvent, ForwardEvent__Output as _routerrpc_ForwardEvent__Output } from '../routerrpc/ForwardEvent';
import type { ForwardFailEvent as _routerrpc_ForwardFailEvent, ForwardFailEvent__Output as _routerrpc_ForwardFailEvent__Output } from '../routerrpc/ForwardFailEvent';
import type { SettleEvent as _routerrpc_SettleEvent, SettleEvent__Output as _routerrpc_SettleEvent__Output } from '../routerrpc/SettleEvent';
import type { LinkFailEvent as _routerrpc_LinkFailEvent, LinkFailEvent__Output as _routerrpc_LinkFailEvent__Output } from '../routerrpc/LinkFailEvent';
import type { Long } from '@grpc/proto-loader';

// Original file: proto/router.proto

export enum _routerrpc_HtlcEvent_EventType {
  UNKNOWN = 0,
  SEND = 1,
  RECEIVE = 2,
  FORWARD = 3,
}

export interface HtlcEvent {
  'incoming_channel_id'?: (number | string | Long);
  'outgoing_channel_id'?: (number | string | Long);
  'incoming_htlc_id'?: (number | string | Long);
  'outgoing_htlc_id'?: (number | string | Long);
  'timestamp_ns'?: (number | string | Long);
  'event_type'?: (_routerrpc_HtlcEvent_EventType | keyof typeof _routerrpc_HtlcEvent_EventType);
  'forward_event'?: (_routerrpc_ForwardEvent | null);
  'forward_fail_event'?: (_routerrpc_ForwardFailEvent | null);
  'settle_event'?: (_routerrpc_SettleEvent | null);
  'link_fail_event'?: (_routerrpc_LinkFailEvent | null);
  'event'?: "forward_event"|"forward_fail_event"|"settle_event"|"link_fail_event";
}

export interface HtlcEvent__Output {
  'incoming_channel_id': (string);
  'outgoing_channel_id': (string);
  'incoming_htlc_id': (string);
  'outgoing_htlc_id': (string);
  'timestamp_ns': (string);
  'event_type': (keyof typeof _routerrpc_HtlcEvent_EventType);
  'forward_event'?: (_routerrpc_ForwardEvent__Output | null);
  'forward_fail_event'?: (_routerrpc_ForwardFailEvent__Output | null);
  'settle_event'?: (_routerrpc_SettleEvent__Output | null);
  'link_fail_event'?: (_routerrpc_LinkFailEvent__Output | null);
  'event': "forward_event"|"forward_fail_event"|"settle_event"|"link_fail_event";
}
