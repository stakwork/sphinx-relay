// Original file: proto/greenlight.proto

import type {
  Confirmation as _greenlight_Confirmation,
  Confirmation__Output as _greenlight_Confirmation__Output,
} from '../greenlight/Confirmation'

export interface ListFundsRequest {
  minconf?: _greenlight_Confirmation | null
}

export interface ListFundsRequest__Output {
  minconf: _greenlight_Confirmation__Output | null
}
