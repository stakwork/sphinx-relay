// Original file: proto/cln/node.proto

export interface CheckmessageRequest {
  message?: string
  zbase?: string
  pubkey?: Buffer | Uint8Array | string
  _pubkey?: 'pubkey'
}

export interface CheckmessageRequest__Output {
  message: string
  zbase: string
  pubkey?: Buffer
  _pubkey: 'pubkey'
}
