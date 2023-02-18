// Original file: proto/greenlight.proto

import type {
  OffChainPayment as _greenlight_OffChainPayment,
  OffChainPayment__Output as _greenlight_OffChainPayment__Output,
} from '../greenlight/OffChainPayment'

export interface IncomingPayment {
  offchain?: _greenlight_OffChainPayment | null
  details?: 'offchain'
}

export interface IncomingPayment__Output {
  offchain?: _greenlight_OffChainPayment__Output | null
  details: 'offchain'
}
