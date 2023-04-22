// Original file: proto/cln/node.proto

import type {
  FeeratesPerkbEstimates as _cln_FeeratesPerkbEstimates,
  FeeratesPerkbEstimates__Output as _cln_FeeratesPerkbEstimates__Output,
} from '../cln/FeeratesPerkbEstimates'

export interface FeeratesPerkb {
  min_acceptable?: number
  max_acceptable?: number
  opening?: number
  mutual_close?: number
  unilateral_close?: number
  delayed_to_us?: number
  htlc_resolution?: number
  penalty?: number
  estimates?: _cln_FeeratesPerkbEstimates[]
  floor?: number
  _floor?: 'floor'
  _opening?: 'opening'
  _mutual_close?: 'mutual_close'
  _unilateral_close?: 'unilateral_close'
  _delayed_to_us?: 'delayed_to_us'
  _htlc_resolution?: 'htlc_resolution'
  _penalty?: 'penalty'
}

export interface FeeratesPerkb__Output {
  min_acceptable: number
  max_acceptable: number
  opening?: number
  mutual_close?: number
  unilateral_close?: number
  delayed_to_us?: number
  htlc_resolution?: number
  penalty?: number
  estimates: _cln_FeeratesPerkbEstimates__Output[]
  floor?: number
  _floor: 'floor'
  _opening: 'opening'
  _mutual_close: 'mutual_close'
  _unilateral_close: 'unilateral_close'
  _delayed_to_us: 'delayed_to_us'
  _htlc_resolution: 'htlc_resolution'
  _penalty: 'penalty'
}
