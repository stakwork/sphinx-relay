// Original file: proto/walletunlocker.proto

export interface InitWalletResponse {
  admin_macaroon?: Buffer | Uint8Array | string
}

export interface InitWalletResponse__Output {
  admin_macaroon: Buffer
}
