// Original file: proto/cln/node.proto

import type {
  ListpeersPeers as _cln_ListpeersPeers,
  ListpeersPeers__Output as _cln_ListpeersPeers__Output,
} from '../cln/ListpeersPeers'

export interface ListpeersResponse {
  peers?: _cln_ListpeersPeers[]
}

export interface ListpeersResponse__Output {
  peers: _cln_ListpeersPeers__Output[]
}
