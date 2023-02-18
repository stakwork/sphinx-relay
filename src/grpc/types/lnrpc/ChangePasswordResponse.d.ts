// Original file: proto/walletunlocker.proto

export interface ChangePasswordResponse {
  admin_macaroon?: Buffer | Uint8Array | string
}

export interface ChangePasswordResponse__Output {
  admin_macaroon: Buffer
}
