// Original file: proto/cln/primitives.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface AmountOrAll {
  amount?: _cln_Amount | null
  all?: boolean
  value?: 'amount' | 'all'
}

export interface AmountOrAll__Output {
  amount?: _cln_Amount__Output | null
  all?: boolean
  value: 'amount' | 'all'
}
