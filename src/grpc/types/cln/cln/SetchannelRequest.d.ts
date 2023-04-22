// Original file: proto/cln/node.proto

import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'

export interface SetchannelRequest {
  id?: string
  feebase?: _cln_Amount | null
  feeppm?: number
  htlcmin?: _cln_Amount | null
  htlcmax?: _cln_Amount | null
  enforcedelay?: number
  _feebase?: 'feebase'
  _feeppm?: 'feeppm'
  _htlcmin?: 'htlcmin'
  _htlcmax?: 'htlcmax'
  _enforcedelay?: 'enforcedelay'
}

export interface SetchannelRequest__Output {
  id: string
  feebase?: _cln_Amount__Output | null
  feeppm?: number
  htlcmin?: _cln_Amount__Output | null
  htlcmax?: _cln_Amount__Output | null
  enforcedelay?: number
  _feebase: 'feebase'
  _feeppm: 'feeppm'
  _htlcmin: 'htlcmin'
  _htlcmax: 'htlcmax'
  _enforcedelay: 'enforcedelay'
}
