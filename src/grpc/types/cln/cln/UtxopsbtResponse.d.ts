// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type {
  UtxopsbtReservations as _cln_UtxopsbtReservations,
  UtxopsbtReservations__Output as _cln_UtxopsbtReservations__Output,
} from '../cln/UtxopsbtReservations'

export interface UtxopsbtResponse {
  psbt?: string
  feerate_per_kw?: number
  estimated_final_weight?: number
  excess_msat?: _cln_Amount | null
  change_outnum?: number
  reservations?: _cln_UtxopsbtReservations[]
  _change_outnum?: 'change_outnum'
}

export interface UtxopsbtResponse__Output {
  psbt: string
  feerate_per_kw: number
  estimated_final_weight: number
  excess_msat: _cln_Amount__Output | null
  change_outnum?: number
  reservations: _cln_UtxopsbtReservations__Output[]
  _change_outnum: 'change_outnum'
}
