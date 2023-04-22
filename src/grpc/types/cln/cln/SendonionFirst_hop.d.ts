// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface SendonionFirst_hop {
  id?: Buffer | Uint8Array | string
  amount_msat?: _cln_Amount | null
  delay?: number
}

export interface SendonionFirst_hop__Output {
  id: Buffer
  amount_msat: _cln_Amount__Output | null
  delay: number
}
