// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type {
  Feerate as _cln_Feerate,
  Feerate__Output as _cln_Feerate__Output,
} from '../cln/Feerate'
import type {
  Outpoint as _cln_Outpoint,
  Outpoint__Output as _cln_Outpoint__Output,
} from '../cln/Outpoint'

export interface UtxopsbtRequest {
  satoshi?: _cln_Amount | null
  feerate?: _cln_Feerate | null
  startweight?: number
  utxos?: _cln_Outpoint[]
  reserve?: number
  locktime?: number
  min_witness_weight?: number
  reservedok?: boolean
  excess_as_change?: boolean
  _reserve?: 'reserve'
  _reservedok?: 'reservedok'
  _locktime?: 'locktime'
  _min_witness_weight?: 'min_witness_weight'
  _excess_as_change?: 'excess_as_change'
}

export interface UtxopsbtRequest__Output {
  satoshi: _cln_Amount__Output | null
  feerate: _cln_Feerate__Output | null
  startweight: number
  utxos: _cln_Outpoint__Output[]
  reserve?: number
  locktime?: number
  min_witness_weight?: number
  reservedok?: boolean
  excess_as_change?: boolean
  _reserve: 'reserve'
  _reservedok: 'reservedok'
  _locktime: 'locktime'
  _min_witness_weight: 'min_witness_weight'
  _excess_as_change: 'excess_as_change'
}
