// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type { Long } from '@grpc/proto-loader'

export interface GetrouteRequest {
  id?: Buffer | Uint8Array | string
  riskfactor?: number | string | Long
  cltv?: number | string
  fromid?: Buffer | Uint8Array | string
  fuzzpercent?: number
  exclude?: string[]
  maxhops?: number
  amount_msat?: _cln_Amount | null
  _cltv?: 'cltv'
  _fromid?: 'fromid'
  _fuzzpercent?: 'fuzzpercent'
  _maxhops?: 'maxhops'
}

export interface GetrouteRequest__Output {
  id: Buffer
  riskfactor: string
  cltv?: number
  fromid?: Buffer
  fuzzpercent?: number
  exclude: string[]
  maxhops?: number
  amount_msat: _cln_Amount__Output | null
  _cltv: 'cltv'
  _fromid: 'fromid'
  _fuzzpercent: 'fuzzpercent'
  _maxhops: 'maxhops'
}
