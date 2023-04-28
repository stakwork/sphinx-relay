// Original file: proto/cln/node.proto

import type {
  FeeratesPerkb as _cln_FeeratesPerkb,
  FeeratesPerkb__Output as _cln_FeeratesPerkb__Output,
} from '../cln/FeeratesPerkb'
import type {
  FeeratesPerkw as _cln_FeeratesPerkw,
  FeeratesPerkw__Output as _cln_FeeratesPerkw__Output,
} from '../cln/FeeratesPerkw'
import type {
  FeeratesOnchain_fee_estimates as _cln_FeeratesOnchain_fee_estimates,
  FeeratesOnchain_fee_estimates__Output as _cln_FeeratesOnchain_fee_estimates__Output,
} from '../cln/FeeratesOnchain_fee_estimates'

export interface FeeratesResponse {
  warning_missing_feerates?: string
  perkb?: _cln_FeeratesPerkb | null
  perkw?: _cln_FeeratesPerkw | null
  onchain_fee_estimates?: _cln_FeeratesOnchain_fee_estimates | null
  _warning_missing_feerates?: 'warning_missing_feerates'
  _perkb?: 'perkb'
  _perkw?: 'perkw'
  _onchain_fee_estimates?: 'onchain_fee_estimates'
}

export interface FeeratesResponse__Output {
  warning_missing_feerates?: string
  perkb?: _cln_FeeratesPerkb__Output | null
  perkw?: _cln_FeeratesPerkw__Output | null
  onchain_fee_estimates?: _cln_FeeratesOnchain_fee_estimates__Output | null
  _warning_missing_feerates: 'warning_missing_feerates'
  _perkb: 'perkb'
  _perkw: 'perkw'
  _onchain_fee_estimates: 'onchain_fee_estimates'
}
