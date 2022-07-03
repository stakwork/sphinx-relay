// Original file: proto/lightning.proto


export interface DeletePaymentRequest {
  'payment_hash'?: (Buffer | Uint8Array | string);
  'failed_htlcs_only'?: (boolean);
}

export interface DeletePaymentRequest__Output {
  'payment_hash': (Buffer);
  'failed_htlcs_only': (boolean);
}
