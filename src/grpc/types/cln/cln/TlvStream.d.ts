// Original file: proto/cln/primitives.proto

import type {
  TlvEntry as _cln_TlvEntry,
  TlvEntry__Output as _cln_TlvEntry__Output,
} from '../cln/TlvEntry'

export interface TlvStream {
  entries?: _cln_TlvEntry[]
}

export interface TlvStream__Output {
  entries: _cln_TlvEntry__Output[]
}
