// Original file: proto/router.proto

import type { Failure as _lnrpc_Failure, Failure__Output as _lnrpc_Failure__Output } from '../lnrpc/Failure';

export interface SendToRouteResponse {
  'preimage'?: (Buffer | Uint8Array | string);
  'failure'?: (_lnrpc_Failure | null);
}

export interface SendToRouteResponse__Output {
  'preimage': (Buffer);
  'failure': (_lnrpc_Failure__Output | null);
}
