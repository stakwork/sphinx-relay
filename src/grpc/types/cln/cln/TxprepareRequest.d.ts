// Original file: proto/cln/node.proto

import type {
  Feerate as _cln_Feerate,
  Feerate__Output as _cln_Feerate__Output,
} from '../cln/Feerate'
import type {
  Outpoint as _cln_Outpoint,
  Outpoint__Output as _cln_Outpoint__Output,
} from '../cln/Outpoint'
import type {
  OutputDesc as _cln_OutputDesc,
  OutputDesc__Output as _cln_OutputDesc__Output,
} from '../cln/OutputDesc'

export interface TxprepareRequest {
  feerate?: _cln_Feerate | null
  minconf?: number
  utxos?: _cln_Outpoint[]
  outputs?: _cln_OutputDesc[]
  _feerate?: 'feerate'
  _minconf?: 'minconf'
}

export interface TxprepareRequest__Output {
  feerate?: _cln_Feerate__Output | null
  minconf?: number
  utxos: _cln_Outpoint__Output[]
  outputs: _cln_OutputDesc__Output[]
  _feerate: 'feerate'
  _minconf: 'minconf'
}
