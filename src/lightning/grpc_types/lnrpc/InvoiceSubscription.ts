// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader';

export interface InvoiceSubscription {
  'add_index'?: (number | string | Long);
  'settle_index'?: (number | string | Long);
}

export interface InvoiceSubscription__Output {
  'add_index': (string);
  'settle_index': (string);
}
