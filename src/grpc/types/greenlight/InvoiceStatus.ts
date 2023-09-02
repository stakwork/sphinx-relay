// Original file: proto/greenlight.proto

export const InvoiceStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  EXPIRED: 'EXPIRED',
} as const

export type InvoiceStatus = 'UNPAID' | 0 | 'PAID' | 1 | 'EXPIRED' | 2

export type InvoiceStatus__Output =
  (typeof InvoiceStatus)[keyof typeof InvoiceStatus]
