// Original file: proto/walletkit.proto

import type {
  TapscriptFullTree as _walletrpc_TapscriptFullTree,
  TapscriptFullTree__Output as _walletrpc_TapscriptFullTree__Output,
} from '../walletrpc/TapscriptFullTree'
import type {
  TapscriptPartialReveal as _walletrpc_TapscriptPartialReveal,
  TapscriptPartialReveal__Output as _walletrpc_TapscriptPartialReveal__Output,
} from '../walletrpc/TapscriptPartialReveal'

export interface ImportTapscriptRequest {
  internal_public_key?: Buffer | Uint8Array | string
  full_tree?: _walletrpc_TapscriptFullTree | null
  partial_reveal?: _walletrpc_TapscriptPartialReveal | null
  root_hash_only?: Buffer | Uint8Array | string
  full_key_only?: boolean
  script?: 'full_tree' | 'partial_reveal' | 'root_hash_only' | 'full_key_only'
}

export interface ImportTapscriptRequest__Output {
  internal_public_key: Buffer
  full_tree?: _walletrpc_TapscriptFullTree__Output | null
  partial_reveal?: _walletrpc_TapscriptPartialReveal__Output | null
  root_hash_only?: Buffer
  full_key_only?: boolean
  script: 'full_tree' | 'partial_reveal' | 'root_hash_only' | 'full_key_only'
}
