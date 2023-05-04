// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_ListnodesNodesAddresses_ListnodesNodesAddressesType = {
  DNS: 'DNS',
  IPV4: 'IPV4',
  IPV6: 'IPV6',
  TORV2: 'TORV2',
  TORV3: 'TORV3',
  WEBSOCKET: 'WEBSOCKET',
} as const

export type _cln_ListnodesNodesAddresses_ListnodesNodesAddressesType =
  | 'DNS'
  | 0
  | 'IPV4'
  | 1
  | 'IPV6'
  | 2
  | 'TORV2'
  | 3
  | 'TORV3'
  | 4
  | 'WEBSOCKET'
  | 5

export type _cln_ListnodesNodesAddresses_ListnodesNodesAddressesType__Output =
  typeof _cln_ListnodesNodesAddresses_ListnodesNodesAddressesType[keyof typeof _cln_ListnodesNodesAddresses_ListnodesNodesAddressesType]

export interface ListnodesNodesAddresses {
  item_type?: _cln_ListnodesNodesAddresses_ListnodesNodesAddressesType
  port?: number
  address?: string
  _address?: 'address'
}

export interface ListnodesNodesAddresses__Output {
  item_type: _cln_ListnodesNodesAddresses_ListnodesNodesAddressesType__Output
  port: number
  address?: string
  _address: 'address'
}
