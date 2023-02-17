// Original file: proto/signer.proto

import type {
  TweakDesc as _signrpc_TweakDesc,
  TweakDesc__Output as _signrpc_TweakDesc__Output,
} from '../signrpc/TweakDesc'
import type {
  TaprootTweakDesc as _signrpc_TaprootTweakDesc,
  TaprootTweakDesc__Output as _signrpc_TaprootTweakDesc__Output,
} from '../signrpc/TaprootTweakDesc'

export interface MuSig2CombineKeysRequest {
  all_signer_pubkeys?: (Buffer | Uint8Array | string)[]
  tweaks?: _signrpc_TweakDesc[]
  taproot_tweak?: _signrpc_TaprootTweakDesc | null
}

export interface MuSig2CombineKeysRequest__Output {
  all_signer_pubkeys: Buffer[]
  tweaks: _signrpc_TweakDesc__Output[]
  taproot_tweak: _signrpc_TaprootTweakDesc__Output | null
}
