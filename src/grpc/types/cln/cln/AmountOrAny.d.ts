// Original file: proto/cln/primitives.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface AmountOrAny {
  amount?: _cln_Amount | null
  any?: boolean
  value?: 'amount' | 'any'
}

export interface AmountOrAny__Output {
  amount?: _cln_Amount__Output | null
  any?: boolean
  value: 'amount' | 'any'
}
