// Original file: proto/walletkit.proto

import type { OutPoint as _lnrpc_OutPoint, OutPoint__Output as _lnrpc_OutPoint__Output } from '../lnrpc/OutPoint';
import type { Long } from '@grpc/proto-loader';

export interface UtxoLease {
  'id'?: (Buffer | Uint8Array | string);
  'outpoint'?: (_lnrpc_OutPoint | null);
  'expiration'?: (number | string | Long);
  'pk_script'?: (Buffer | Uint8Array | string);
  'value'?: (number | string | Long);
}

export interface UtxoLease__Output {
  'id': (Buffer);
  'outpoint': (_lnrpc_OutPoint__Output | null);
  'expiration': (string);
  'pk_script': (Buffer);
  'value': (string);
}
