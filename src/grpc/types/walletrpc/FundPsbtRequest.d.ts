// Original file: proto/walletkit.proto

import type { Long } from '@grpc/proto-loader'
import type {
  TxTemplate as _walletrpc_TxTemplate,
  TxTemplate__Output as _walletrpc_TxTemplate__Output,
} from '../walletrpc/TxTemplate'

export interface FundPsbtRequest {
  psbt?: Buffer | Uint8Array | string
  raw?: _walletrpc_TxTemplate | null
  target_conf?: number
  sat_per_vbyte?: number | string | Long
  account?: string
  min_confs?: number
  spend_unconfirmed?: boolean
  template?: 'psbt' | 'raw'
  fees?: 'target_conf' | 'sat_per_vbyte'
}

export interface FundPsbtRequest__Output {
  psbt?: Buffer
  raw?: _walletrpc_TxTemplate__Output | null
  target_conf?: number
  sat_per_vbyte?: string
  account: string
  min_confs: number
  spend_unconfirmed: boolean
  template: 'psbt' | 'raw'
  fees: 'target_conf' | 'sat_per_vbyte'
}
