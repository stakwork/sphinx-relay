// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_GetinfoAddress_GetinfoAddressType = {
  DNS: 'DNS',
  IPV4: 'IPV4',
  IPV6: 'IPV6',
  TORV2: 'TORV2',
  TORV3: 'TORV3',
  WEBSOCKET: 'WEBSOCKET',
} as const

export type _cln_GetinfoAddress_GetinfoAddressType =
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

export type _cln_GetinfoAddress_GetinfoAddressType__Output =
  (typeof _cln_GetinfoAddress_GetinfoAddressType)[keyof typeof _cln_GetinfoAddress_GetinfoAddressType]

export interface GetinfoAddress {
  item_type?: _cln_GetinfoAddress_GetinfoAddressType
  port?: number
  address?: string
  _address?: 'address'
}

export interface GetinfoAddress__Output {
  item_type: _cln_GetinfoAddress_GetinfoAddressType__Output
  port: number
  address?: string
  _address: 'address'
}
