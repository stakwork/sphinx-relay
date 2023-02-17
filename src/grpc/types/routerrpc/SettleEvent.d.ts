// Original file: proto/router.proto

export interface SettleEvent {
  preimage?: Buffer | Uint8Array | string
}

export interface SettleEvent__Output {
  preimage: Buffer
}
