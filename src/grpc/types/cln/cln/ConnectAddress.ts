// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_ConnectAddress_ConnectAddressType = {
  LOCAL_SOCKET: 'LOCAL_SOCKET',
  IPV4: 'IPV4',
  IPV6: 'IPV6',
  TORV2: 'TORV2',
  TORV3: 'TORV3',
} as const

export type _cln_ConnectAddress_ConnectAddressType =
  | 'LOCAL_SOCKET'
  | 0
  | 'IPV4'
  | 1
  | 'IPV6'
  | 2
  | 'TORV2'
  | 3
  | 'TORV3'
  | 4

export type _cln_ConnectAddress_ConnectAddressType__Output =
  (typeof _cln_ConnectAddress_ConnectAddressType)[keyof typeof _cln_ConnectAddress_ConnectAddressType]

export interface ConnectAddress {
  item_type?: _cln_ConnectAddress_ConnectAddressType
  socket?: string
  address?: string
  port?: number
  _socket?: 'socket'
  _address?: 'address'
  _port?: 'port'
}

export interface ConnectAddress__Output {
  item_type: _cln_ConnectAddress_ConnectAddressType__Output
  socket?: string
  address?: string
  port?: number
  _socket: 'socket'
  _address: 'address'
  _port: 'port'
}
