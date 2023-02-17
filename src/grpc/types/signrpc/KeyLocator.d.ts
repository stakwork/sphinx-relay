// Original file: proto/signer.proto

export interface KeyLocator {
  key_family?: number
  key_index?: number
}

export interface KeyLocator__Output {
  key_family: number
  key_index: number
}
