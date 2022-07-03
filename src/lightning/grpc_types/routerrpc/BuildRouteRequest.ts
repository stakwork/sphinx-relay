// Original file: proto/router.proto

import type { Long } from '@grpc/proto-loader';

export interface BuildRouteRequest {
  'amt_msat'?: (number | string | Long);
  'final_cltv_delta'?: (number);
  'outgoing_chan_id'?: (number | string | Long);
  'hop_pubkeys'?: (Buffer | Uint8Array | string)[];
  'payment_addr'?: (Buffer | Uint8Array | string);
}

export interface BuildRouteRequest__Output {
  'amt_msat': (string);
  'final_cltv_delta': (number);
  'outgoing_chan_id': (string);
  'hop_pubkeys': (Buffer)[];
  'payment_addr': (Buffer);
}
