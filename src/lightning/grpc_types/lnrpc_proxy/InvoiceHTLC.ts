// Original file: proto/rpc_proxy.proto

import type { InvoiceHTLCState as _lnrpc_proxy_InvoiceHTLCState } from '../lnrpc_proxy/InvoiceHTLCState';
import type { Long } from '@grpc/proto-loader';

export interface InvoiceHTLC {
  'chan_id'?: (number | string | Long);
  'htlc_index'?: (number | string | Long);
  'amt_msat'?: (number | string | Long);
  'accept_height'?: (number);
  'accept_time'?: (number | string | Long);
  'resolve_time'?: (number | string | Long);
  'expiry_height'?: (number);
  'state'?: (_lnrpc_proxy_InvoiceHTLCState | keyof typeof _lnrpc_proxy_InvoiceHTLCState);
  'custom_records'?: ({[key: number]: Buffer | Uint8Array | string});
  'mpp_total_amt_msat'?: (number | string | Long);
}

export interface InvoiceHTLC__Output {
  'chan_id': (string);
  'htlc_index': (string);
  'amt_msat': (string);
  'accept_height': (number);
  'accept_time': (string);
  'resolve_time': (string);
  'expiry_height': (number);
  'state': (keyof typeof _lnrpc_proxy_InvoiceHTLCState);
  'custom_records': ({[key: number]: Buffer});
  'mpp_total_amt_msat': (string);
}
