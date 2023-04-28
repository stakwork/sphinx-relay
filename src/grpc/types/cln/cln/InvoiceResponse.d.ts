// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'

export interface InvoiceResponse {
  bolt11?: string
  payment_hash?: Buffer | Uint8Array | string
  payment_secret?: Buffer | Uint8Array | string
  expires_at?: number | string | Long
  warning_capacity?: string
  warning_offline?: string
  warning_deadends?: string
  warning_private_unused?: string
  warning_mpp?: string
  _warning_capacity?: 'warning_capacity'
  _warning_offline?: 'warning_offline'
  _warning_deadends?: 'warning_deadends'
  _warning_private_unused?: 'warning_private_unused'
  _warning_mpp?: 'warning_mpp'
}

export interface InvoiceResponse__Output {
  bolt11: string
  payment_hash: Buffer
  payment_secret: Buffer
  expires_at: string
  warning_capacity?: string
  warning_offline?: string
  warning_deadends?: string
  warning_private_unused?: string
  warning_mpp?: string
  _warning_capacity: 'warning_capacity'
  _warning_offline: 'warning_offline'
  _warning_deadends: 'warning_deadends'
  _warning_private_unused: 'warning_private_unused'
  _warning_mpp: 'warning_mpp'
}
