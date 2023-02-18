// Original file: proto/lightning.proto

import type {
  FailedUpdate as _lnrpc_FailedUpdate,
  FailedUpdate__Output as _lnrpc_FailedUpdate__Output,
} from '../lnrpc/FailedUpdate'

export interface PolicyUpdateResponse {
  failed_updates?: _lnrpc_FailedUpdate[]
}

export interface PolicyUpdateResponse__Output {
  failed_updates: _lnrpc_FailedUpdate__Output[]
}
