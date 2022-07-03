// Original file: proto/lightning.proto

import type { InvoiceHTLCState as _lnrpc_InvoiceHTLCState } from '../lnrpc/InvoiceHTLCState';
import type { Long } from '@grpc/proto-loader';

export interface AMPInvoiceState {
  'state'?: (_lnrpc_InvoiceHTLCState | keyof typeof _lnrpc_InvoiceHTLCState);
  'settle_index'?: (number | string | Long);
  'settle_time'?: (number | string | Long);
  'amt_paid_msat'?: (number | string | Long);
}

export interface AMPInvoiceState__Output {
  'state': (keyof typeof _lnrpc_InvoiceHTLCState);
  'settle_index': (string);
  'settle_time': (string);
  'amt_paid_msat': (string);
}
