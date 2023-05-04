// Original file: proto/cln/primitives.proto

import type {
  RouteHop as _cln_RouteHop,
  RouteHop__Output as _cln_RouteHop__Output,
} from '../cln/RouteHop'

export interface Routehint {
  hops?: _cln_RouteHop[]
}

export interface Routehint__Output {
  hops: _cln_RouteHop__Output[]
}
