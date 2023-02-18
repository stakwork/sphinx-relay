// Original file: proto/greenlight.proto

import type {
  Amount as _greenlight_Amount,
  Amount__Output as _greenlight_Amount__Output,
} from '../greenlight/Amount'
import type {
  Feerate as _greenlight_Feerate,
  Feerate__Output as _greenlight_Feerate__Output,
} from '../greenlight/Feerate'
import type {
  Confirmation as _greenlight_Confirmation,
  Confirmation__Output as _greenlight_Confirmation__Output,
} from '../greenlight/Confirmation'
import type {
  Outpoint as _greenlight_Outpoint,
  Outpoint__Output as _greenlight_Outpoint__Output,
} from '../greenlight/Outpoint'

export interface WithdrawRequest {
  destination?: string
  amount?: _greenlight_Amount | null
  feerate?: _greenlight_Feerate | null
  minconf?: _greenlight_Confirmation | null
  utxos?: _greenlight_Outpoint[]
}

export interface WithdrawRequest__Output {
  destination: string
  amount: _greenlight_Amount__Output | null
  feerate: _greenlight_Feerate__Output | null
  minconf: _greenlight_Confirmation__Output | null
  utxos: _greenlight_Outpoint__Output[]
}
