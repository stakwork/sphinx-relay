// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_GetinfoBinding_GetinfoBindingType = {
  LOCAL_SOCKET: 'LOCAL_SOCKET',
  IPV4: 'IPV4',
  IPV6: 'IPV6',
  TORV2: 'TORV2',
  TORV3: 'TORV3',
} as const

export type _cln_GetinfoBinding_GetinfoBindingType =
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

export type _cln_GetinfoBinding_GetinfoBindingType__Output =
  (typeof _cln_GetinfoBinding_GetinfoBindingType)[keyof typeof _cln_GetinfoBinding_GetinfoBindingType]

export interface GetinfoBinding {
  item_type?: _cln_GetinfoBinding_GetinfoBindingType
  address?: string
  port?: number
  socket?: string
  _address?: 'address'
  _port?: 'port'
  _socket?: 'socket'
}

export interface GetinfoBinding__Output {
  item_type: _cln_GetinfoBinding_GetinfoBindingType__Output
  address?: string
  port?: number
  socket?: string
  _address: 'address'
  _port: 'port'
  _socket: 'socket'
}
