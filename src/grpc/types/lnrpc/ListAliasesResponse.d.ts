// Original file: proto/lightning.proto

import type {
  AliasMap as _lnrpc_AliasMap,
  AliasMap__Output as _lnrpc_AliasMap__Output,
} from '../lnrpc/AliasMap'

export interface ListAliasesResponse {
  alias_maps?: _lnrpc_AliasMap[]
}

export interface ListAliasesResponse__Output {
  alias_maps: _lnrpc_AliasMap__Output[]
}
