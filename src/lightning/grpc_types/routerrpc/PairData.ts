// Original file: proto/router.proto

import type { Long } from '@grpc/proto-loader';

export interface PairData {
  'fail_time'?: (number | string | Long);
  'fail_amt_sat'?: (number | string | Long);
  'fail_amt_msat'?: (number | string | Long);
  'success_time'?: (number | string | Long);
  'success_amt_sat'?: (number | string | Long);
  'success_amt_msat'?: (number | string | Long);
}

export interface PairData__Output {
  'fail_time': (string);
  'fail_amt_sat': (string);
  'fail_amt_msat': (string);
  'success_time': (string);
  'success_amt_sat': (string);
  'success_amt_msat': (string);
}
