// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type {
  RoutehintList as _cln_RoutehintList,
  RoutehintList__Output as _cln_RoutehintList__Output,
} from '../cln/RoutehintList'
import type {
  TlvStream as _cln_TlvStream,
  TlvStream__Output as _cln_TlvStream__Output,
} from '../cln/TlvStream'

export interface KeysendRequest {
  destination?: Buffer | Uint8Array | string
  label?: string
  maxfeepercent?: number | string
  retry_for?: number
  maxdelay?: number
  exemptfee?: _cln_Amount | null
  routehints?: _cln_RoutehintList | null
  extratlvs?: _cln_TlvStream | null
  amount_msat?: _cln_Amount | null
  _label?: 'label'
  _maxfeepercent?: 'maxfeepercent'
  _retry_for?: 'retry_for'
  _maxdelay?: 'maxdelay'
  _exemptfee?: 'exemptfee'
  _routehints?: 'routehints'
  _extratlvs?: 'extratlvs'
}

export interface KeysendRequest__Output {
  destination: Buffer
  label?: string
  maxfeepercent?: number
  retry_for?: number
  maxdelay?: number
  exemptfee?: _cln_Amount__Output | null
  routehints?: _cln_RoutehintList__Output | null
  extratlvs?: _cln_TlvStream__Output | null
  amount_msat: _cln_Amount__Output | null
  _label: 'label'
  _maxfeepercent: 'maxfeepercent'
  _retry_for: 'retry_for'
  _maxdelay: 'maxdelay'
  _exemptfee: 'exemptfee'
  _routehints: 'routehints'
  _extratlvs: 'extratlvs'
}
