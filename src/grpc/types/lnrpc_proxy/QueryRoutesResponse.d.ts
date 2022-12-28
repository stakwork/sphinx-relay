// Original file: proto/rpc_proxy.proto

import type {
  Route as _lnrpc_proxy_Route,
  Route__Output as _lnrpc_proxy_Route__Output,
} from '../lnrpc_proxy/Route'

export interface QueryRoutesResponse {
  routes?: _lnrpc_proxy_Route[]
  success_prob?: number | string
}

export interface QueryRoutesResponse__Output {
  routes: _lnrpc_proxy_Route__Output[]
  success_prob: number
}
