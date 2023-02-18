// Original file: proto/router.proto

import type {
  HtlcInfo as _routerrpc_HtlcInfo,
  HtlcInfo__Output as _routerrpc_HtlcInfo__Output,
} from '../routerrpc/HtlcInfo'
import type {
  _lnrpc_Failure_FailureCode,
  _lnrpc_Failure_FailureCode__Output,
} from '../lnrpc/Failure'
import type {
  FailureDetail as _routerrpc_FailureDetail,
  FailureDetail__Output as _routerrpc_FailureDetail__Output,
} from '../routerrpc/FailureDetail'

export interface LinkFailEvent {
  info?: _routerrpc_HtlcInfo | null
  wire_failure?: _lnrpc_Failure_FailureCode
  failure_detail?: _routerrpc_FailureDetail
  failure_string?: string
}

export interface LinkFailEvent__Output {
  info: _routerrpc_HtlcInfo__Output | null
  wire_failure: _lnrpc_Failure_FailureCode__Output
  failure_detail: _routerrpc_FailureDetail__Output
  failure_string: string
}
