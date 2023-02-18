// Original file: proto/walletkit.proto

import type {
  UtxoLease as _walletrpc_UtxoLease,
  UtxoLease__Output as _walletrpc_UtxoLease__Output,
} from '../walletrpc/UtxoLease'

export interface FundPsbtResponse {
  funded_psbt?: Buffer | Uint8Array | string
  change_output_index?: number
  locked_utxos?: _walletrpc_UtxoLease[]
}

export interface FundPsbtResponse__Output {
  funded_psbt: Buffer
  change_output_index: number
  locked_utxos: _walletrpc_UtxoLease__Output[]
}
