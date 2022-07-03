// Original file: proto/walletkit.proto

import type { Utxo as _lnrpc_Utxo, Utxo__Output as _lnrpc_Utxo__Output } from '../lnrpc/Utxo';

export interface ListUnspentResponse {
  'utxos'?: (_lnrpc_Utxo)[];
}

export interface ListUnspentResponse__Output {
  'utxos': (_lnrpc_Utxo__Output)[];
}
