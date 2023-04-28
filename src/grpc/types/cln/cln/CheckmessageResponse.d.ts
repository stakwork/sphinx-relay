// Original file: proto/cln/node.proto

export interface CheckmessageResponse {
  verified?: boolean
  pubkey?: Buffer | Uint8Array | string
}

export interface CheckmessageResponse__Output {
  verified: boolean
  pubkey: Buffer
}
