// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'
import type {
  MacaroonPermission as _lnrpc_MacaroonPermission,
  MacaroonPermission__Output as _lnrpc_MacaroonPermission__Output,
} from '../lnrpc/MacaroonPermission'

export interface BakeMacaroonRequest {
  permissions?: _lnrpc_MacaroonPermission[]
  root_key_id?: number | string | Long
  allow_external_permissions?: boolean
}

export interface BakeMacaroonRequest__Output {
  permissions: _lnrpc_MacaroonPermission__Output[]
  root_key_id: string
  allow_external_permissions: boolean
}
