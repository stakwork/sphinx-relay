// Original file: proto/walletkit.proto

import type {
  TapLeaf as _walletrpc_TapLeaf,
  TapLeaf__Output as _walletrpc_TapLeaf__Output,
} from '../walletrpc/TapLeaf'

export interface TapscriptFullTree {
  all_leaves?: _walletrpc_TapLeaf[]
}

export interface TapscriptFullTree__Output {
  all_leaves: _walletrpc_TapLeaf__Output[]
}
