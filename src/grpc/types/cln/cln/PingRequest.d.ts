// Original file: proto/cln/node.proto

export interface PingRequest {
  id?: Buffer | Uint8Array | string
  len?: number
  pongbytes?: number
  _len?: 'len'
  _pongbytes?: 'pongbytes'
}

export interface PingRequest__Output {
  id: Buffer
  len?: number
  pongbytes?: number
  _len: 'len'
  _pongbytes: 'pongbytes'
}
