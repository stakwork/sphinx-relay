// Original file: proto/lightning.proto

import type { OutPoint as _lnrpc_OutPoint, OutPoint__Output as _lnrpc_OutPoint__Output } from '../lnrpc/OutPoint';
import type { UpdateFailure as _lnrpc_UpdateFailure } from '../lnrpc/UpdateFailure';

export interface FailedUpdate {
  'outpoint'?: (_lnrpc_OutPoint | null);
  'reason'?: (_lnrpc_UpdateFailure | keyof typeof _lnrpc_UpdateFailure);
  'update_error'?: (string);
}

export interface FailedUpdate__Output {
  'outpoint': (_lnrpc_OutPoint__Output | null);
  'reason': (keyof typeof _lnrpc_UpdateFailure);
  'update_error': (string);
}
