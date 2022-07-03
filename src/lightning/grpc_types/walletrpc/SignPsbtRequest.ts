// Original file: proto/walletkit.proto


export interface SignPsbtRequest {
  'funded_psbt'?: (Buffer | Uint8Array | string);
}

export interface SignPsbtRequest__Output {
  'funded_psbt': (Buffer);
}
