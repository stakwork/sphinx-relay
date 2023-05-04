// Original file: proto/cln/node.proto

import type {
  AmountOrAny as _cln_AmountOrAny,
  AmountOrAny__Output as _cln_AmountOrAny__Output,
} from '../cln/AmountOrAny'
import type { Long } from '@grpc/proto-loader'

export interface InvoiceRequest {
  description?: string
  label?: string
  fallbacks?: string[]
  preimage?: Buffer | Uint8Array | string
  cltv?: number
  expiry?: number | string | Long
  exposeprivatechannels?: boolean
  deschashonly?: boolean
  amount_msat?: _cln_AmountOrAny | null
  _expiry?: 'expiry'
  _preimage?: 'preimage'
  _exposeprivatechannels?: 'exposeprivatechannels'
  _cltv?: 'cltv'
  _deschashonly?: 'deschashonly'
}

export interface InvoiceRequest__Output {
  description: string
  label: string
  fallbacks: string[]
  preimage?: Buffer
  cltv?: number
  expiry?: string
  exposeprivatechannels?: boolean
  deschashonly?: boolean
  amount_msat: _cln_AmountOrAny__Output | null
  _expiry: 'expiry'
  _preimage: 'preimage'
  _exposeprivatechannels: 'exposeprivatechannels'
  _cltv: 'cltv'
  _deschashonly: 'deschashonly'
}
