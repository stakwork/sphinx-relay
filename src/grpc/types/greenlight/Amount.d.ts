// Original file: proto/greenlight.proto

import type { Long } from '@grpc/proto-loader'

export interface Amount {
  millisatoshi?: number | string | Long
  satoshi?: number | string | Long
  bitcoin?: number | string | Long
  all?: boolean
  any?: boolean
  unit?: 'millisatoshi' | 'satoshi' | 'bitcoin' | 'all' | 'any'
}

export interface Amount__Output {
  millisatoshi?: string
  satoshi?: string
  bitcoin?: string
  all?: boolean
  any?: boolean
  unit: 'millisatoshi' | 'satoshi' | 'bitcoin' | 'all' | 'any'
}
