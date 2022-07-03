// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader';

export interface ChannelUpdate {
  'signature'?: (Buffer | Uint8Array | string);
  'chain_hash'?: (Buffer | Uint8Array | string);
  'chan_id'?: (number | string | Long);
  'timestamp'?: (number);
  'channel_flags'?: (number);
  'time_lock_delta'?: (number);
  'htlc_minimum_msat'?: (number | string | Long);
  'base_fee'?: (number);
  'fee_rate'?: (number);
  'message_flags'?: (number);
  'htlc_maximum_msat'?: (number | string | Long);
  'extra_opaque_data'?: (Buffer | Uint8Array | string);
}

export interface ChannelUpdate__Output {
  'signature': (Buffer);
  'chain_hash': (Buffer);
  'chan_id': (string);
  'timestamp': (number);
  'channel_flags': (number);
  'time_lock_delta': (number);
  'htlc_minimum_msat': (string);
  'base_fee': (number);
  'fee_rate': (number);
  'message_flags': (number);
  'htlc_maximum_msat': (string);
  'extra_opaque_data': (Buffer);
}
