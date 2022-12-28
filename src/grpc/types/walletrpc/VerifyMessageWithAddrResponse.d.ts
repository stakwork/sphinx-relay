// Original file: proto/walletkit.proto

export interface VerifyMessageWithAddrResponse {
  valid?: boolean
  pubkey?: Buffer | Uint8Array | string
}

export interface VerifyMessageWithAddrResponse__Output {
  valid: boolean
  pubkey: Buffer
}
