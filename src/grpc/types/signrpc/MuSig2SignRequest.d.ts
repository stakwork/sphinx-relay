// Original file: proto/signer.proto

export interface MuSig2SignRequest {
  session_id?: Buffer | Uint8Array | string
  message_digest?: Buffer | Uint8Array | string
  cleanup?: boolean
}

export interface MuSig2SignRequest__Output {
  session_id: Buffer
  message_digest: Buffer
  cleanup: boolean
}
