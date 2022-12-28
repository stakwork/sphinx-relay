// Original file: proto/signer.proto

export interface TaprootTweakDesc {
  script_root?: Buffer | Uint8Array | string
  key_spend_only?: boolean
}

export interface TaprootTweakDesc__Output {
  script_root: Buffer
  key_spend_only: boolean
}
