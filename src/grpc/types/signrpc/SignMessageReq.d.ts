// Original file: proto/signer.proto

import type {
  KeyLocator as _signrpc_KeyLocator,
  KeyLocator__Output as _signrpc_KeyLocator__Output,
} from '../signrpc/KeyLocator'

export interface SignMessageReq {
  msg?: Buffer | Uint8Array | string
  key_loc?: _signrpc_KeyLocator | null
  double_hash?: boolean
  compact_sig?: boolean
  schnorr_sig?: boolean
  schnorr_sig_tap_tweak?: Buffer | Uint8Array | string
}

export interface SignMessageReq__Output {
  msg: Buffer
  key_loc: _signrpc_KeyLocator__Output | null
  double_hash: boolean
  compact_sig: boolean
  schnorr_sig: boolean
  schnorr_sig_tap_tweak: Buffer
}
