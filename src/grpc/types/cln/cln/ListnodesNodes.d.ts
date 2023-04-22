// Original file: proto/cln/node.proto

import type {
  ListnodesNodesAddresses as _cln_ListnodesNodesAddresses,
  ListnodesNodesAddresses__Output as _cln_ListnodesNodesAddresses__Output,
} from '../cln/ListnodesNodesAddresses'

export interface ListnodesNodes {
  nodeid?: Buffer | Uint8Array | string
  last_timestamp?: number
  alias?: string
  color?: Buffer | Uint8Array | string
  features?: Buffer | Uint8Array | string
  addresses?: _cln_ListnodesNodesAddresses[]
  _last_timestamp?: 'last_timestamp'
  _alias?: 'alias'
  _color?: 'color'
  _features?: 'features'
}

export interface ListnodesNodes__Output {
  nodeid: Buffer
  last_timestamp?: number
  alias?: string
  color?: Buffer
  features?: Buffer
  addresses: _cln_ListnodesNodesAddresses__Output[]
  _last_timestamp: 'last_timestamp'
  _alias: 'alias'
  _color: 'color'
  _features: 'features'
}
