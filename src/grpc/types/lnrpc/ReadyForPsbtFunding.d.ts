// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'

export interface ReadyForPsbtFunding {
  funding_address?: string
  funding_amount?: number | string | Long
  psbt?: Buffer | Uint8Array | string
}

export interface ReadyForPsbtFunding__Output {
  funding_address: string
  funding_amount: string
  psbt: Buffer
}
