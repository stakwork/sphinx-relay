// Original file: proto/cln/primitives.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface OutputDesc {
  address?: string
  amount?: _cln_Amount | null
}

export interface OutputDesc__Output {
  address: string
  amount: _cln_Amount__Output | null
}
