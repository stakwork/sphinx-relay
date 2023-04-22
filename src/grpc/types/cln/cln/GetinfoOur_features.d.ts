// Original file: proto/cln/node.proto

export interface GetinfoOur_features {
  init?: Buffer | Uint8Array | string
  node?: Buffer | Uint8Array | string
  channel?: Buffer | Uint8Array | string
  invoice?: Buffer | Uint8Array | string
}

export interface GetinfoOur_features__Output {
  init: Buffer
  node: Buffer
  channel: Buffer
  invoice: Buffer
}
