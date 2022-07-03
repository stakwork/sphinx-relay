// Original file: proto/rpc_proxy.proto

import type { Hop as _lnrpc_proxy_Hop, Hop__Output as _lnrpc_proxy_Hop__Output } from '../lnrpc_proxy/Hop';
import type { Long } from '@grpc/proto-loader';

export interface Route {
  'total_time_lock'?: (number);
  'total_fees'?: (number | string | Long);
  'total_amt'?: (number | string | Long);
  'hops'?: (_lnrpc_proxy_Hop)[];
  'total_fees_msat'?: (number | string | Long);
  'total_amt_msat'?: (number | string | Long);
}

export interface Route__Output {
  'total_time_lock': (number);
  'total_fees': (string);
  'total_amt': (string);
  'hops': (_lnrpc_proxy_Hop__Output)[];
  'total_fees_msat': (string);
  'total_amt_msat': (string);
}
