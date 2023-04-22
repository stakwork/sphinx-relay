// Original file: proto/cln/node.proto

export interface CreateonionHops {
  pubkey?: Buffer | Uint8Array | string
  payload?: Buffer | Uint8Array | string
}

export interface CreateonionHops__Output {
  pubkey: Buffer
  payload: Buffer
}
