// Original file: proto/walletkit.proto

import type {
  OutPoint as _lnrpc_OutPoint,
  OutPoint__Output as _lnrpc_OutPoint__Output,
} from '../lnrpc/OutPoint'

export interface ReleaseOutputRequest {
  id?: Buffer | Uint8Array | string
  outpoint?: _lnrpc_OutPoint | null
}

export interface ReleaseOutputRequest__Output {
  id: Buffer
  outpoint: _lnrpc_OutPoint__Output | null
}
