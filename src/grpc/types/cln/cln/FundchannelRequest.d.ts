// Original file: proto/cln/node.proto

import type {
  AmountOrAll as _cln_AmountOrAll,
  AmountOrAll__Output as _cln_AmountOrAll__Output,
} from '../cln/AmountOrAll'
import type {
  Feerate as _cln_Feerate,
  Feerate__Output as _cln_Feerate__Output,
} from '../cln/Feerate'
import type {
  Amount as _cln_Amount,
  Amount__Output as _cln_Amount__Output,
} from '../cln/Amount'
import type {
  Outpoint as _cln_Outpoint,
  Outpoint__Output as _cln_Outpoint__Output,
} from '../cln/Outpoint'

export interface FundchannelRequest {
  amount?: _cln_AmountOrAll | null
  feerate?: _cln_Feerate | null
  announce?: boolean
  push_msat?: _cln_Amount | null
  close_to?: string
  request_amt?: _cln_Amount | null
  compact_lease?: string
  id?: Buffer | Uint8Array | string
  minconf?: number
  utxos?: _cln_Outpoint[]
  mindepth?: number
  reserve?: _cln_Amount | null
  _feerate?: 'feerate'
  _announce?: 'announce'
  _minconf?: 'minconf'
  _push_msat?: 'push_msat'
  _close_to?: 'close_to'
  _request_amt?: 'request_amt'
  _compact_lease?: 'compact_lease'
  _mindepth?: 'mindepth'
  _reserve?: 'reserve'
}

export interface FundchannelRequest__Output {
  amount: _cln_AmountOrAll__Output | null
  feerate?: _cln_Feerate__Output | null
  announce?: boolean
  push_msat?: _cln_Amount__Output | null
  close_to?: string
  request_amt?: _cln_Amount__Output | null
  compact_lease?: string
  id: Buffer
  minconf?: number
  utxos: _cln_Outpoint__Output[]
  mindepth?: number
  reserve?: _cln_Amount__Output | null
  _feerate: 'feerate'
  _announce: 'announce'
  _minconf: 'minconf'
  _push_msat: 'push_msat'
  _close_to: 'close_to'
  _request_amt: 'request_amt'
  _compact_lease: 'compact_lease'
  _mindepth: 'mindepth'
  _reserve: 'reserve'
}
