// Original file: proto/router.proto

import type {
  PairHistory as _routerrpc_PairHistory,
  PairHistory__Output as _routerrpc_PairHistory__Output,
} from '../routerrpc/PairHistory'

export interface QueryMissionControlResponse {
  pairs?: _routerrpc_PairHistory[]
}

export interface QueryMissionControlResponse__Output {
  pairs: _routerrpc_PairHistory__Output[]
}
