// Original file: proto/lightning.proto

export interface InterceptFeedback {
  error?: string
  replace_response?: boolean
  replacement_serialized?: Buffer | Uint8Array | string
}

export interface InterceptFeedback__Output {
  error: string
  replace_response: boolean
  replacement_serialized: Buffer
}
