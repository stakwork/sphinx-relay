// Original file: proto/cln/node.proto

import type {
  FeeratesPerkwEstimates as _cln_FeeratesPerkwEstimates,
  FeeratesPerkwEstimates__Output as _cln_FeeratesPerkwEstimates__Output,
} from '../cln/FeeratesPerkwEstimates'

export interface FeeratesPerkw {
  min_acceptable?: number
  max_acceptable?: number
  opening?: number
  mutual_close?: number
  unilateral_close?: number
  delayed_to_us?: number
  htlc_resolution?: number
  penalty?: number
  estimates?: _cln_FeeratesPerkwEstimates[]
  floor?: number
  _floor?: 'floor'
  _opening?: 'opening'
  _mutual_close?: 'mutual_close'
  _unilateral_close?: 'unilateral_close'
  _delayed_to_us?: 'delayed_to_us'
  _htlc_resolution?: 'htlc_resolution'
  _penalty?: 'penalty'
}

export interface FeeratesPerkw__Output {
  min_acceptable: number
  max_acceptable: number
  opening?: number
  mutual_close?: number
  unilateral_close?: number
  delayed_to_us?: number
  htlc_resolution?: number
  penalty?: number
  estimates: _cln_FeeratesPerkwEstimates__Output[]
  floor?: number
  _floor: 'floor'
  _opening: 'opening'
  _mutual_close: 'mutual_close'
  _unilateral_close: 'unilateral_close'
  _delayed_to_us: 'delayed_to_us'
  _htlc_resolution: 'htlc_resolution'
  _penalty: 'penalty'
}
