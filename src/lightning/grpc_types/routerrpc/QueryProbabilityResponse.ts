// Original file: proto/router.proto

import type { PairData as _routerrpc_PairData, PairData__Output as _routerrpc_PairData__Output } from '../routerrpc/PairData';

export interface QueryProbabilityResponse {
  'probability'?: (number | string);
  'history'?: (_routerrpc_PairData | null);
}

export interface QueryProbabilityResponse__Output {
  'probability': (number);
  'history': (_routerrpc_PairData__Output | null);
}
