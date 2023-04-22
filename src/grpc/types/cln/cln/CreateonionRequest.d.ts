// Original file: proto/cln/node.proto

import type {
  CreateonionHops as _cln_CreateonionHops,
  CreateonionHops__Output as _cln_CreateonionHops__Output,
} from '../cln/CreateonionHops'

export interface CreateonionRequest {
  hops?: _cln_CreateonionHops[]
  assocdata?: Buffer | Uint8Array | string
  session_key?: Buffer | Uint8Array | string
  onion_size?: number
  _session_key?: 'session_key'
  _onion_size?: 'onion_size'
}

export interface CreateonionRequest__Output {
  hops: _cln_CreateonionHops__Output[]
  assocdata: Buffer
  session_key?: Buffer
  onion_size?: number
  _session_key: 'session_key'
  _onion_size: 'onion_size'
}
