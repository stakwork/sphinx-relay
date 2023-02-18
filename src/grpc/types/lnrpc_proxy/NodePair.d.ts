// Original file: proto/rpc_proxy.proto

export interface NodePair {
  from?: Buffer | Uint8Array | string
  to?: Buffer | Uint8Array | string
}

export interface NodePair__Output {
  from: Buffer
  to: Buffer
}
