// Original file: proto/cln/node.proto

export interface SendpsbtResponse {
  tx?: Buffer | Uint8Array | string
  txid?: Buffer | Uint8Array | string
}

export interface SendpsbtResponse__Output {
  tx: Buffer
  txid: Buffer
}
