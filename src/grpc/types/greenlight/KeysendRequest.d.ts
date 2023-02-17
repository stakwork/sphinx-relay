// Original file: proto/greenlight.proto

import type {
  Amount as _greenlight_Amount,
  Amount__Output as _greenlight_Amount__Output,
} from '../greenlight/Amount'
import type {
  Routehint as _greenlight_Routehint,
  Routehint__Output as _greenlight_Routehint__Output,
} from '../greenlight/Routehint'
import type {
  TlvField as _greenlight_TlvField,
  TlvField__Output as _greenlight_TlvField__Output,
} from '../greenlight/TlvField'

export interface KeysendRequest {
  node_id?: Buffer | Uint8Array | string
  amount?: _greenlight_Amount | null
  label?: string
  routehints?: _greenlight_Routehint[]
  extratlvs?: _greenlight_TlvField[]
}

export interface KeysendRequest__Output {
  node_id: Buffer
  amount: _greenlight_Amount__Output | null
  label: string
  routehints: _greenlight_Routehint__Output[]
  extratlvs: _greenlight_TlvField__Output[]
}
