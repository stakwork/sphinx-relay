// Original file: proto/signer.proto

import type {
  KeyLocator as _signrpc_KeyLocator,
  KeyLocator__Output as _signrpc_KeyLocator__Output,
} from '../signrpc/KeyLocator'
import type {
  KeyDescriptor as _signrpc_KeyDescriptor,
  KeyDescriptor__Output as _signrpc_KeyDescriptor__Output,
} from '../signrpc/KeyDescriptor'

export interface SharedKeyRequest {
  ephemeral_pubkey?: Buffer | Uint8Array | string
  key_loc?: _signrpc_KeyLocator | null
  key_desc?: _signrpc_KeyDescriptor | null
}

export interface SharedKeyRequest__Output {
  ephemeral_pubkey: Buffer
  key_loc: _signrpc_KeyLocator__Output | null
  key_desc: _signrpc_KeyDescriptor__Output | null
}
