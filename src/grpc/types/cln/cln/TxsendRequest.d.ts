// Original file: proto/cln/node.proto

export interface TxsendRequest {
  txid?: Buffer | Uint8Array | string
}

export interface TxsendRequest__Output {
  txid: Buffer
}
