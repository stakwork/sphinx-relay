// Original file: proto/cln/node.proto

export interface SignmessageResponse {
  signature?: Buffer | Uint8Array | string
  recid?: Buffer | Uint8Array | string
  zbase?: string
}

export interface SignmessageResponse__Output {
  signature: Buffer
  recid: Buffer
  zbase: string
}
