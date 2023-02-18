// Original file: proto/walletkit.proto

import type {
  TapLeaf as _walletrpc_TapLeaf,
  TapLeaf__Output as _walletrpc_TapLeaf__Output,
} from '../walletrpc/TapLeaf'

export interface TapscriptPartialReveal {
  revealed_leaf?: _walletrpc_TapLeaf | null
  full_inclusion_proof?: Buffer | Uint8Array | string
}

export interface TapscriptPartialReveal__Output {
  revealed_leaf: _walletrpc_TapLeaf__Output | null
  full_inclusion_proof: Buffer
}
