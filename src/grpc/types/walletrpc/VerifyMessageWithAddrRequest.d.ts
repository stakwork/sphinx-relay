// Original file: proto/walletkit.proto

export interface VerifyMessageWithAddrRequest {
  msg?: Buffer | Uint8Array | string
  signature?: string
  addr?: string
}

export interface VerifyMessageWithAddrRequest__Output {
  msg: Buffer
  signature: string
  addr: string
}
