// Original file: proto/router.proto

import type { HtlcInfo as _routerrpc_HtlcInfo, HtlcInfo__Output as _routerrpc_HtlcInfo__Output } from '../routerrpc/HtlcInfo';
import type { _lnrpc_Failure_FailureCode } from '../lnrpc/Failure';
import type { FailureDetail as _routerrpc_FailureDetail } from '../routerrpc/FailureDetail';

export interface LinkFailEvent {
  'info'?: (_routerrpc_HtlcInfo | null);
  'wire_failure'?: (_lnrpc_Failure_FailureCode | keyof typeof _lnrpc_Failure_FailureCode);
  'failure_detail'?: (_routerrpc_FailureDetail | keyof typeof _routerrpc_FailureDetail);
  'failure_string'?: (string);
}

export interface LinkFailEvent__Output {
  'info': (_routerrpc_HtlcInfo__Output | null);
  'wire_failure': (keyof typeof _lnrpc_Failure_FailureCode);
  'failure_detail': (keyof typeof _routerrpc_FailureDetail);
  'failure_string': (string);
}
