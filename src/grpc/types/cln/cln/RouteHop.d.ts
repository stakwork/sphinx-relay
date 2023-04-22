// Original file: proto/cln/primitives.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface RouteHop {
  id?: Buffer | Uint8Array | string
  short_channel_id?: string
  feebase?: _cln_Amount | null
  feeprop?: number
  expirydelta?: number
}

export interface RouteHop__Output {
  id: Buffer
  short_channel_id: string
  feebase: _cln_Amount__Output | null
  feeprop: number
  expirydelta: number
}
