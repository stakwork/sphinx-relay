// Original file: proto/greenlight.proto

import type {
  FeeratePreset as _greenlight_FeeratePreset,
  FeeratePreset__Output as _greenlight_FeeratePreset__Output,
} from '../greenlight/FeeratePreset'
import type { Long } from '@grpc/proto-loader'

export interface Feerate {
  preset?: _greenlight_FeeratePreset
  perkw?: number | string | Long
  perkb?: number | string | Long
  value?: 'preset' | 'perkw' | 'perkb'
}

export interface Feerate__Output {
  preset?: _greenlight_FeeratePreset__Output
  perkw?: string
  perkb?: string
  value: 'preset' | 'perkw' | 'perkb'
}
