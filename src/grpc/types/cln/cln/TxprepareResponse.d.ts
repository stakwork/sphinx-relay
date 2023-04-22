// Original file: proto/cln/node.proto

export interface TxprepareResponse {
  psbt?: string
  unsigned_tx?: Buffer | Uint8Array | string
  txid?: Buffer | Uint8Array | string
}

export interface TxprepareResponse__Output {
  psbt: string
  unsigned_tx: Buffer
  txid: Buffer
}
