// Original file: proto/cln/node.proto

export interface CreateinvoiceRequest {
  invstring?: string
  label?: string
  preimage?: Buffer | Uint8Array | string
}

export interface CreateinvoiceRequest__Output {
  invstring: string
  label: string
  preimage: Buffer
}
