// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface SendpayRoute {
  id?: Buffer | Uint8Array | string
  delay?: number
  channel?: string
  amount_msat?: _cln_Amount | null
}

export interface SendpayRoute__Output {
  id: Buffer
  delay: number
  channel: string
  amount_msat: _cln_Amount__Output | null
}
