// Original file: proto/signer.proto

import type {
  KeyLocator as _signrpc_KeyLocator,
  KeyLocator__Output as _signrpc_KeyLocator__Output,
} from '../signrpc/KeyLocator'

export interface KeyDescriptor {
  raw_key_bytes?: Buffer | Uint8Array | string
  key_loc?: _signrpc_KeyLocator | null
}

export interface KeyDescriptor__Output {
  raw_key_bytes: Buffer
  key_loc: _signrpc_KeyLocator__Output | null
}
