// Original file: proto/cln/node.proto

import type { Long } from '@grpc/proto-loader'

export interface WaitanyinvoiceRequest {
  lastpay_index?: number | string | Long
  timeout?: number | string | Long
  _lastpay_index?: 'lastpay_index'
  _timeout?: 'timeout'
}

export interface WaitanyinvoiceRequest__Output {
  lastpay_index?: string
  timeout?: string
  _lastpay_index: 'lastpay_index'
  _timeout: 'timeout'
}
