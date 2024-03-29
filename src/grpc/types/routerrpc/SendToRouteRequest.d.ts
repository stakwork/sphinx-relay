// Original file: proto/router.proto

import type {
  Route as _lnrpc_Route,
  Route__Output as _lnrpc_Route__Output,
} from '../lnrpc/Route'

export interface SendToRouteRequest {
  payment_hash?: Buffer | Uint8Array | string
  route?: _lnrpc_Route | null
  skip_temp_err?: boolean
}

export interface SendToRouteRequest__Output {
  payment_hash: Buffer
  route: _lnrpc_Route__Output | null
  skip_temp_err: boolean
}
