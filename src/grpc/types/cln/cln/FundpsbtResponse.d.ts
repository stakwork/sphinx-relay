// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type {
  FundpsbtReservations as _cln_FundpsbtReservations,
  FundpsbtReservations__Output as _cln_FundpsbtReservations__Output,
} from '../cln/FundpsbtReservations'

export interface FundpsbtResponse {
  psbt?: string
  feerate_per_kw?: number
  estimated_final_weight?: number
  excess_msat?: _cln_Amount | null
  change_outnum?: number
  reservations?: _cln_FundpsbtReservations[]
  _change_outnum?: 'change_outnum'
}

export interface FundpsbtResponse__Output {
  psbt: string
  feerate_per_kw: number
  estimated_final_weight: number
  excess_msat: _cln_Amount__Output | null
  change_outnum?: number
  reservations: _cln_FundpsbtReservations__Output[]
  _change_outnum: 'change_outnum'
}
