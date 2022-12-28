// Original file: proto/walletunlocker.proto

export interface GenSeedRequest {
  aezeed_passphrase?: Buffer | Uint8Array | string
  seed_entropy?: Buffer | Uint8Array | string
}

export interface GenSeedRequest__Output {
  aezeed_passphrase: Buffer
  seed_entropy: Buffer
}
