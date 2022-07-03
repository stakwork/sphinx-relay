// Original file: proto/greenlight.proto


export interface WithdrawResponse {
  'tx'?: (Buffer | Uint8Array | string);
  'txid'?: (Buffer | Uint8Array | string);
}

export interface WithdrawResponse__Output {
  'tx': (Buffer);
  'txid': (Buffer);
}
