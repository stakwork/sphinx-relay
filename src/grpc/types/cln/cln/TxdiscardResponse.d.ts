// Original file: proto/cln/node.proto

export interface TxdiscardResponse {
  unsigned_tx?: Buffer | Uint8Array | string
  txid?: Buffer | Uint8Array | string
}

export interface TxdiscardResponse__Output {
  unsigned_tx: Buffer
  txid: Buffer
}
