// Original file: proto/walletkit.proto

export interface SendOutputsResponse {
  raw_tx?: Buffer | Uint8Array | string
}

export interface SendOutputsResponse__Output {
  raw_tx: Buffer
}
