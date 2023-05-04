// Original file: proto/cln/node.proto

export interface ListpeersRequest {
  id?: Buffer | Uint8Array | string
  level?: string
  _id?: 'id'
  _level?: 'level'
}

export interface ListpeersRequest__Output {
  id?: Buffer
  level?: string
  _id: 'id'
  _level: 'level'
}
