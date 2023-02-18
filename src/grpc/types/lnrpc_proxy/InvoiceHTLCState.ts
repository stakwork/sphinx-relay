// Original file: proto/rpc_proxy.proto

export const InvoiceHTLCState = {
  ACCEPTED: 'ACCEPTED',
  SETTLED: 'SETTLED',
  CANCELED: 'CANCELED',
} as const

export type InvoiceHTLCState = 'ACCEPTED' | 0 | 'SETTLED' | 1 | 'CANCELED' | 2

export type InvoiceHTLCState__Output =
  typeof InvoiceHTLCState[keyof typeof InvoiceHTLCState]
