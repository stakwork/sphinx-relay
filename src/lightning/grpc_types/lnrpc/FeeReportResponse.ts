// Original file: proto/lightning.proto

import type { ChannelFeeReport as _lnrpc_ChannelFeeReport, ChannelFeeReport__Output as _lnrpc_ChannelFeeReport__Output } from '../lnrpc/ChannelFeeReport';
import type { Long } from '@grpc/proto-loader';

export interface FeeReportResponse {
  'channel_fees'?: (_lnrpc_ChannelFeeReport)[];
  'day_fee_sum'?: (number | string | Long);
  'week_fee_sum'?: (number | string | Long);
  'month_fee_sum'?: (number | string | Long);
}

export interface FeeReportResponse__Output {
  'channel_fees': (_lnrpc_ChannelFeeReport__Output)[];
  'day_fee_sum': (string);
  'week_fee_sum': (string);
  'month_fee_sum': (string);
}
