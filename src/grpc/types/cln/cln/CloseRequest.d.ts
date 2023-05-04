// Original file: proto/cln/node.proto

import type {
  Outpoint as _cln_Outpoint,
  Outpoint__Output as _cln_Outpoint__Output,
} from '../cln/Outpoint'
import type {
  Feerate as _cln_Feerate,
  Feerate__Output as _cln_Feerate__Output,
} from '../cln/Feerate'

export interface CloseRequest {
  id?: string
  unilateraltimeout?: number
  destination?: string
  fee_negotiation_step?: string
  wrong_funding?: _cln_Outpoint | null
  force_lease_closed?: boolean
  feerange?: _cln_Feerate[]
  _unilateraltimeout?: 'unilateraltimeout'
  _destination?: 'destination'
  _fee_negotiation_step?: 'fee_negotiation_step'
  _wrong_funding?: 'wrong_funding'
  _force_lease_closed?: 'force_lease_closed'
}

export interface CloseRequest__Output {
  id: string
  unilateraltimeout?: number
  destination?: string
  fee_negotiation_step?: string
  wrong_funding?: _cln_Outpoint__Output | null
  force_lease_closed?: boolean
  feerange: _cln_Feerate__Output[]
  _unilateraltimeout: 'unilateraltimeout'
  _destination: 'destination'
  _fee_negotiation_step: 'fee_negotiation_step'
  _wrong_funding: 'wrong_funding'
  _force_lease_closed: 'force_lease_closed'
}
