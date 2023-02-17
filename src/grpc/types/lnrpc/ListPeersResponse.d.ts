// Original file: proto/lightning.proto

import type {
  Peer as _lnrpc_Peer,
  Peer__Output as _lnrpc_Peer__Output,
} from '../lnrpc/Peer'

export interface ListPeersResponse {
  peers?: _lnrpc_Peer[]
}

export interface ListPeersResponse__Output {
  peers: _lnrpc_Peer__Output[]
}
