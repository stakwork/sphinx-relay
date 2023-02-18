// Original file: proto/signer.proto

import type {
  KeyLocator as _signrpc_KeyLocator,
  KeyLocator__Output as _signrpc_KeyLocator__Output,
} from '../signrpc/KeyLocator'
import type {
  TweakDesc as _signrpc_TweakDesc,
  TweakDesc__Output as _signrpc_TweakDesc__Output,
} from '../signrpc/TweakDesc'
import type {
  TaprootTweakDesc as _signrpc_TaprootTweakDesc,
  TaprootTweakDesc__Output as _signrpc_TaprootTweakDesc__Output,
} from '../signrpc/TaprootTweakDesc'

export interface MuSig2SessionRequest {
  key_loc?: _signrpc_KeyLocator | null
  all_signer_pubkeys?: (Buffer | Uint8Array | string)[]
  other_signer_public_nonces?: (Buffer | Uint8Array | string)[]
  tweaks?: _signrpc_TweakDesc[]
  taproot_tweak?: _signrpc_TaprootTweakDesc | null
}

export interface MuSig2SessionRequest__Output {
  key_loc: _signrpc_KeyLocator__Output | null
  all_signer_pubkeys: Buffer[]
  other_signer_public_nonces: Buffer[]
  tweaks: _signrpc_TweakDesc__Output[]
  taproot_tweak: _signrpc_TaprootTweakDesc__Output | null
}
