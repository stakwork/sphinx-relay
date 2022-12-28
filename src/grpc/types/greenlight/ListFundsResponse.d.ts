// Original file: proto/greenlight.proto

import type {
  ListFundsOutput as _greenlight_ListFundsOutput,
  ListFundsOutput__Output as _greenlight_ListFundsOutput__Output,
} from '../greenlight/ListFundsOutput'
import type {
  ListFundsChannel as _greenlight_ListFundsChannel,
  ListFundsChannel__Output as _greenlight_ListFundsChannel__Output,
} from '../greenlight/ListFundsChannel'

export interface ListFundsResponse {
  outputs?: _greenlight_ListFundsOutput[]
  channels?: _greenlight_ListFundsChannel[]
}

export interface ListFundsResponse__Output {
  outputs: _greenlight_ListFundsOutput__Output[]
  channels: _greenlight_ListFundsChannel__Output[]
}
