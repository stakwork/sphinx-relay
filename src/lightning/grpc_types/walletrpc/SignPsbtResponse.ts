// Original file: proto/walletkit.proto


export interface SignPsbtResponse {
  'signed_psbt'?: (Buffer | Uint8Array | string);
}

export interface SignPsbtResponse__Output {
  'signed_psbt': (Buffer);
}
