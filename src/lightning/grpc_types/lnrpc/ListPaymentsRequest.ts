// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader';

export interface ListPaymentsRequest {
  'include_incomplete'?: (boolean);
  'index_offset'?: (number | string | Long);
  'max_payments'?: (number | string | Long);
  'reversed'?: (boolean);
  'count_total_payments'?: (boolean);
}

export interface ListPaymentsRequest__Output {
  'include_incomplete': (boolean);
  'index_offset': (string);
  'max_payments': (string);
  'reversed': (boolean);
  'count_total_payments': (boolean);
}
