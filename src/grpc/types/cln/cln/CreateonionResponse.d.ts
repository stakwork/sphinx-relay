// Original file: proto/cln/node.proto

export interface CreateonionResponse {
  onion?: Buffer | Uint8Array | string
  shared_secrets?: (Buffer | Uint8Array | string)[]
}

export interface CreateonionResponse__Output {
  onion: Buffer
  shared_secrets: Buffer[]
}
