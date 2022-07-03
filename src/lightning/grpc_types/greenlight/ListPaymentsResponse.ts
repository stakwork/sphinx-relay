// Original file: proto/greenlight.proto

import type { Payment as _greenlight_Payment, Payment__Output as _greenlight_Payment__Output } from '../greenlight/Payment';

export interface ListPaymentsResponse {
  'payments'?: (_greenlight_Payment)[];
}

export interface ListPaymentsResponse__Output {
  'payments': (_greenlight_Payment__Output)[];
}
