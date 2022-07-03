// Original file: proto/router.proto

import type { PairData as _routerrpc_PairData, PairData__Output as _routerrpc_PairData__Output } from '../routerrpc/PairData';

export interface PairHistory {
  'node_from'?: (Buffer | Uint8Array | string);
  'node_to'?: (Buffer | Uint8Array | string);
  'history'?: (_routerrpc_PairData | null);
}

export interface PairHistory__Output {
  'node_from': (Buffer);
  'node_to': (Buffer);
  'history': (_routerrpc_PairData__Output | null);
}
