// Original file: proto/walletkit.proto

import type { PendingSweep as _walletrpc_PendingSweep, PendingSweep__Output as _walletrpc_PendingSweep__Output } from '../walletrpc/PendingSweep';

export interface PendingSweepsResponse {
  'pending_sweeps'?: (_walletrpc_PendingSweep)[];
}

export interface PendingSweepsResponse__Output {
  'pending_sweeps': (_walletrpc_PendingSweep__Output)[];
}
