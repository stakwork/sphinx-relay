// Original file: proto/signer.proto


export interface TweakDesc {
  'tweak'?: (Buffer | Uint8Array | string);
  'is_x_only'?: (boolean);
}

export interface TweakDesc__Output {
  'tweak': (Buffer);
  'is_x_only': (boolean);
}
