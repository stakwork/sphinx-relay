// Original file: proto/cln/node.proto

export interface ListinvoicesRequest {
  label?: string
  invstring?: string
  payment_hash?: Buffer | Uint8Array | string
  offer_id?: string
  _label?: 'label'
  _invstring?: 'invstring'
  _payment_hash?: 'payment_hash'
  _offer_id?: 'offer_id'
}

export interface ListinvoicesRequest__Output {
  label?: string
  invstring?: string
  payment_hash?: Buffer
  offer_id?: string
  _label: 'label'
  _invstring: 'invstring'
  _payment_hash: 'payment_hash'
  _offer_id: 'offer_id'
}
