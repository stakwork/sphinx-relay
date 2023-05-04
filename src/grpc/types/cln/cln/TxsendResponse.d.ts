// Original file: proto/cln/node.proto

export interface TxsendResponse {
  psbt?: string
  tx?: Buffer | Uint8Array | string
  txid?: Buffer | Uint8Array | string
}

export interface TxsendResponse__Output {
  psbt: string
  tx: Buffer
  txid: Buffer
}
