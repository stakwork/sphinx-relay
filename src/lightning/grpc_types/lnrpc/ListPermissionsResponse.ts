// Original file: proto/lightning.proto

import type { MacaroonPermissionList as _lnrpc_MacaroonPermissionList, MacaroonPermissionList__Output as _lnrpc_MacaroonPermissionList__Output } from '../lnrpc/MacaroonPermissionList';

export interface ListPermissionsResponse {
  'method_permissions'?: ({[key: string]: _lnrpc_MacaroonPermissionList});
}

export interface ListPermissionsResponse__Output {
  'method_permissions': ({[key: string]: _lnrpc_MacaroonPermissionList__Output});
}
