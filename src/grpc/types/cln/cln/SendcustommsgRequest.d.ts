// Original file: proto/cln/node.proto

export interface SendcustommsgRequest {
  node_id?: Buffer | Uint8Array | string
  msg?: Buffer | Uint8Array | string
}

export interface SendcustommsgRequest__Output {
  node_id: Buffer
  msg: Buffer
}
