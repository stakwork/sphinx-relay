// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader';

export interface ChannelAcceptResponse {
  'accept'?: (boolean);
  'pending_chan_id'?: (Buffer | Uint8Array | string);
  'error'?: (string);
  'upfront_shutdown'?: (string);
  'csv_delay'?: (number);
  'reserve_sat'?: (number | string | Long);
  'in_flight_max_msat'?: (number | string | Long);
  'max_htlc_count'?: (number);
  'min_htlc_in'?: (number | string | Long);
  'min_accept_depth'?: (number);
}

export interface ChannelAcceptResponse__Output {
  'accept': (boolean);
  'pending_chan_id': (Buffer);
  'error': (string);
  'upfront_shutdown': (string);
  'csv_delay': (number);
  'reserve_sat': (string);
  'in_flight_max_msat': (string);
  'max_htlc_count': (number);
  'min_htlc_in': (string);
  'min_accept_depth': (number);
}
