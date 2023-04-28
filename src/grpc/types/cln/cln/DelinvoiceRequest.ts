// Original file: proto/cln/node.proto

// Original file: proto/cln/node.proto

export const _cln_DelinvoiceRequest_DelinvoiceStatus = {
  PAID: 'PAID',
  EXPIRED: 'EXPIRED',
  UNPAID: 'UNPAID',
} as const

export type _cln_DelinvoiceRequest_DelinvoiceStatus =
  | 'PAID'
  | 0
  | 'EXPIRED'
  | 1
  | 'UNPAID'
  | 2

export type _cln_DelinvoiceRequest_DelinvoiceStatus__Output =
  typeof _cln_DelinvoiceRequest_DelinvoiceStatus[keyof typeof _cln_DelinvoiceRequest_DelinvoiceStatus]

export interface DelinvoiceRequest {
  label?: string
  status?: _cln_DelinvoiceRequest_DelinvoiceStatus
  desconly?: boolean
  _desconly?: 'desconly'
}

export interface DelinvoiceRequest__Output {
  label: string
  status: _cln_DelinvoiceRequest_DelinvoiceStatus__Output
  desconly?: boolean
  _desconly: 'desconly'
}
