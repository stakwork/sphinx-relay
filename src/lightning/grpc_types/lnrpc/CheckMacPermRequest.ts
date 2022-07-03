// Original file: proto/lightning.proto

import type { MacaroonPermission as _lnrpc_MacaroonPermission, MacaroonPermission__Output as _lnrpc_MacaroonPermission__Output } from '../lnrpc/MacaroonPermission';

export interface CheckMacPermRequest {
  'macaroon'?: (Buffer | Uint8Array | string);
  'permissions'?: (_lnrpc_MacaroonPermission)[];
  'fullMethod'?: (string);
}

export interface CheckMacPermRequest__Output {
  'macaroon': (Buffer);
  'permissions': (_lnrpc_MacaroonPermission__Output)[];
  'fullMethod': (string);
}
