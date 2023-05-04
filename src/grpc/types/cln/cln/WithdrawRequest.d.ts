// Original file: proto/cln/node.proto

import type {
  AmountOrAll as _cln_AmountOrAll,
  AmountOrAll__Output as _cln_AmountOrAll__Output,
} from '../cln/AmountOrAll'
import type {
  Outpoint as _cln_Outpoint,
  Outpoint__Output as _cln_Outpoint__Output,
} from '../cln/Outpoint'
import type {
  Feerate as _cln_Feerate,
  Feerate__Output as _cln_Feerate__Output,
} from '../cln/Feerate'

export interface WithdrawRequest {
  destination?: string
  satoshi?: _cln_AmountOrAll | null
  minconf?: number
  utxos?: _cln_Outpoint[]
  feerate?: _cln_Feerate | null
  _satoshi?: 'satoshi'
  _feerate?: 'feerate'
  _minconf?: 'minconf'
}

export interface WithdrawRequest__Output {
  destination: string
  satoshi?: _cln_AmountOrAll__Output | null
  minconf?: number
  utxos: _cln_Outpoint__Output[]
  feerate?: _cln_Feerate__Output | null
  _satoshi: 'satoshi'
  _feerate: 'feerate'
  _minconf: 'minconf'
}
