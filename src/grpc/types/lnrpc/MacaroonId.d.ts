// Original file: proto/lightning.proto

import type {
  Op as _lnrpc_Op,
  Op__Output as _lnrpc_Op__Output,
} from '../lnrpc/Op'

export interface MacaroonId {
  nonce?: Buffer | Uint8Array | string
  storageId?: Buffer | Uint8Array | string
  ops?: _lnrpc_Op[]
}

export interface MacaroonId__Output {
  nonce: Buffer
  storageId: Buffer
  ops: _lnrpc_Op__Output[]
}
