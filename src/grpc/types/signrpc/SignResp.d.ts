// Original file: proto/signer.proto

export interface SignResp {
  raw_sigs?: (Buffer | Uint8Array | string)[]
}

export interface SignResp__Output {
  raw_sigs: Buffer[]
}
