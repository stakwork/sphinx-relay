// Original file: proto/scheduler.proto


export interface RegistrationRequest {
  'node_id'?: (Buffer | Uint8Array | string);
  'bip32_key'?: (Buffer | Uint8Array | string);
  'email'?: (string);
  'network'?: (string);
  'challenge'?: (Buffer | Uint8Array | string);
  'signature'?: (Buffer | Uint8Array | string);
}

export interface RegistrationRequest__Output {
  'node_id': (Buffer);
  'bip32_key': (Buffer);
  'email': (string);
  'network': (string);
  'challenge': (Buffer);
  'signature': (Buffer);
}
