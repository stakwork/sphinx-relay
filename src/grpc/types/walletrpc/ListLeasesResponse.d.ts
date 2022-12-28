// Original file: proto/walletkit.proto

import type {
  UtxoLease as _walletrpc_UtxoLease,
  UtxoLease__Output as _walletrpc_UtxoLease__Output,
} from '../walletrpc/UtxoLease'

export interface ListLeasesResponse {
  locked_utxos?: _walletrpc_UtxoLease[]
}

export interface ListLeasesResponse__Output {
  locked_utxos: _walletrpc_UtxoLease__Output[]
}
