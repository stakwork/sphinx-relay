// Original file: proto/walletunlocker.proto


export interface GenSeedResponse {
  'cipher_seed_mnemonic'?: (string)[];
  'enciphered_seed'?: (Buffer | Uint8Array | string);
}

export interface GenSeedResponse__Output {
  'cipher_seed_mnemonic': (string)[];
  'enciphered_seed': (Buffer);
}
