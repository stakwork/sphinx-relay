// Original file: proto/greenlight.proto

import type {
  RoutehintHop as _greenlight_RoutehintHop,
  RoutehintHop__Output as _greenlight_RoutehintHop__Output,
} from '../greenlight/RoutehintHop'

export interface Routehint {
  hops?: _greenlight_RoutehintHop[]
}

export interface Routehint__Output {
  hops: _greenlight_RoutehintHop__Output[]
}
