// Original file: proto/walletkit.proto

export enum AddressType {
  UNKNOWN = 0,
  WITNESS_PUBKEY_HASH = 1,
  NESTED_WITNESS_PUBKEY_HASH = 2,
  HYBRID_NESTED_WITNESS_PUBKEY_HASH = 3,
  TAPROOT_PUBKEY = 4,
}
