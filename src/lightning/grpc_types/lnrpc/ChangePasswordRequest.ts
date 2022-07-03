// Original file: proto/walletunlocker.proto


export interface ChangePasswordRequest {
  'current_password'?: (Buffer | Uint8Array | string);
  'new_password'?: (Buffer | Uint8Array | string);
  'stateless_init'?: (boolean);
  'new_macaroon_root_key'?: (boolean);
}

export interface ChangePasswordRequest__Output {
  'current_password': (Buffer);
  'new_password': (Buffer);
  'stateless_init': (boolean);
  'new_macaroon_root_key': (boolean);
}
