// Original file: proto/router.proto

import type {
  PairHistory as _routerrpc_PairHistory,
  PairHistory__Output as _routerrpc_PairHistory__Output,
} from '../routerrpc/PairHistory'

export interface XImportMissionControlRequest {
  pairs?: _routerrpc_PairHistory[]
  force?: boolean
}

export interface XImportMissionControlRequest__Output {
  pairs: _routerrpc_PairHistory__Output[]
  force: boolean
}
