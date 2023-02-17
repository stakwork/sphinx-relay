// Original file: proto/greenlight.proto

export interface PaymentIdentifier {
  bolt11?: string
  payment_hash?: Buffer | Uint8Array | string
  id?: 'bolt11' | 'payment_hash'
}

export interface PaymentIdentifier__Output {
  bolt11?: string
  payment_hash?: Buffer
  id: 'bolt11' | 'payment_hash'
}
