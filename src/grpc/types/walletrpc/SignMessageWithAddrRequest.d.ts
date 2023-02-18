// Original file: proto/walletkit.proto

export interface SignMessageWithAddrRequest {
  msg?: Buffer | Uint8Array | string
  addr?: string
}

export interface SignMessageWithAddrRequest__Output {
  msg: Buffer
  addr: string
}
