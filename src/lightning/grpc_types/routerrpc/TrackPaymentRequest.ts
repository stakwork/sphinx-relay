// Original file: proto/router.proto


export interface TrackPaymentRequest {
  'payment_hash'?: (Buffer | Uint8Array | string);
  'no_inflight_updates'?: (boolean);
}

export interface TrackPaymentRequest__Output {
  'payment_hash': (Buffer);
  'no_inflight_updates': (boolean);
}
