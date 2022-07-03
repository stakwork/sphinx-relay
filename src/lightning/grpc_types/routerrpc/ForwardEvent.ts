// Original file: proto/router.proto

import type { HtlcInfo as _routerrpc_HtlcInfo, HtlcInfo__Output as _routerrpc_HtlcInfo__Output } from '../routerrpc/HtlcInfo';

export interface ForwardEvent {
  'info'?: (_routerrpc_HtlcInfo | null);
}

export interface ForwardEvent__Output {
  'info': (_routerrpc_HtlcInfo__Output | null);
}
