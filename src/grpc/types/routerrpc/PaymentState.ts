// Original file: proto/router.proto

export const PaymentState = {
  IN_FLIGHT: 'IN_FLIGHT',
  SUCCEEDED: 'SUCCEEDED',
  FAILED_TIMEOUT: 'FAILED_TIMEOUT',
  FAILED_NO_ROUTE: 'FAILED_NO_ROUTE',
  FAILED_ERROR: 'FAILED_ERROR',
  FAILED_INCORRECT_PAYMENT_DETAILS: 'FAILED_INCORRECT_PAYMENT_DETAILS',
  FAILED_INSUFFICIENT_BALANCE: 'FAILED_INSUFFICIENT_BALANCE',
} as const

export type PaymentState =
  | 'IN_FLIGHT'
  | 0
  | 'SUCCEEDED'
  | 1
  | 'FAILED_TIMEOUT'
  | 2
  | 'FAILED_NO_ROUTE'
  | 3
  | 'FAILED_ERROR'
  | 4
  | 'FAILED_INCORRECT_PAYMENT_DETAILS'
  | 5
  | 'FAILED_INSUFFICIENT_BALANCE'
  | 6

export type PaymentState__Output =
  (typeof PaymentState)[keyof typeof PaymentState]
