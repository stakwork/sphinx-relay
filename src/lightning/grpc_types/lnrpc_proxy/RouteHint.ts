// Original file: proto/rpc_proxy.proto

import type { HopHint as _lnrpc_proxy_HopHint, HopHint__Output as _lnrpc_proxy_HopHint__Output } from '../lnrpc_proxy/HopHint';

export interface RouteHint {
  'hop_hints'?: (_lnrpc_proxy_HopHint)[];
}

export interface RouteHint__Output {
  'hop_hints': (_lnrpc_proxy_HopHint__Output)[];
}
