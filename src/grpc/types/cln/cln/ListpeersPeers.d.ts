// Original file: proto/cln/node.proto

import type {
  ListpeersPeersLog as _cln_ListpeersPeersLog,
  ListpeersPeersLog__Output as _cln_ListpeersPeersLog__Output,
} from '../cln/ListpeersPeersLog'
import type {
  ListpeersPeersChannels as _cln_ListpeersPeersChannels,
  ListpeersPeersChannels__Output as _cln_ListpeersPeersChannels__Output,
} from '../cln/ListpeersPeersChannels'

export interface ListpeersPeers {
  id?: Buffer | Uint8Array | string
  connected?: boolean
  log?: _cln_ListpeersPeersLog[]
  channels?: _cln_ListpeersPeersChannels[]
  netaddr?: string[]
  features?: Buffer | Uint8Array | string
  remote_addr?: string
  num_channels?: number
  _num_channels?: 'num_channels'
  _remote_addr?: 'remote_addr'
  _features?: 'features'
}

export interface ListpeersPeers__Output {
  id: Buffer
  connected: boolean
  log: _cln_ListpeersPeersLog__Output[]
  channels: _cln_ListpeersPeersChannels__Output[]
  netaddr: string[]
  features?: Buffer
  remote_addr?: string
  num_channels?: number
  _num_channels: 'num_channels'
  _remote_addr: 'remote_addr'
  _features: 'features'
}
