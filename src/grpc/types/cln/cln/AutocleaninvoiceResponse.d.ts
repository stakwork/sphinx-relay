// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'

export interface AutocleaninvoiceResponse {
  enabled?: boolean
  expired_by?: number | string | Long
  cycle_seconds?: number | string | Long
  _expired_by?: 'expired_by'
  _cycle_seconds?: 'cycle_seconds'
}

export interface AutocleaninvoiceResponse__Output {
  enabled: boolean
  expired_by?: string
  cycle_seconds?: string
  _expired_by: 'expired_by'
  _cycle_seconds: 'cycle_seconds'
}
