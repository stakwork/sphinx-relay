// Original file: proto/cln/node.proto

export interface DisconnectRequest {
  id?: Buffer | Uint8Array | string
  force?: boolean
  _force?: 'force'
}

export interface DisconnectRequest__Output {
  id: Buffer
  force?: boolean
  _force: 'force'
}
