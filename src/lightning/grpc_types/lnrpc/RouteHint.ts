// Original file: proto/lightning.proto

import type { HopHint as _lnrpc_HopHint, HopHint__Output as _lnrpc_HopHint__Output } from '../lnrpc/HopHint';

export interface RouteHint {
  'hop_hints'?: (_lnrpc_HopHint)[];
}

export interface RouteHint__Output {
  'hop_hints': (_lnrpc_HopHint__Output)[];
}
