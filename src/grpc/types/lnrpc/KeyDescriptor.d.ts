// Original file: proto/lightning.proto

import type {
  KeyLocator as _lnrpc_KeyLocator,
  KeyLocator__Output as _lnrpc_KeyLocator__Output,
} from '../lnrpc/KeyLocator'

export interface KeyDescriptor {
  raw_key_bytes?: Buffer | Uint8Array | string
  key_loc?: _lnrpc_KeyLocator | null
}

export interface KeyDescriptor__Output {
  raw_key_bytes: Buffer
  key_loc: _lnrpc_KeyLocator__Output | null
}
