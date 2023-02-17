// Original file: proto/lightning.proto

import type {
  Route as _lnrpc_Route,
  Route__Output as _lnrpc_Route__Output,
} from '../lnrpc/Route'

export interface QueryRoutesResponse {
  routes?: _lnrpc_Route[]
  success_prob?: number | string
}

export interface QueryRoutesResponse__Output {
  routes: _lnrpc_Route__Output[]
  success_prob: number
}
