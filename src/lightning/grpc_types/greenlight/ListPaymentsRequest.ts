// Original file: proto/greenlight.proto

import type { PaymentIdentifier as _greenlight_PaymentIdentifier, PaymentIdentifier__Output as _greenlight_PaymentIdentifier__Output } from '../greenlight/PaymentIdentifier';

export interface ListPaymentsRequest {
  'identifier'?: (_greenlight_PaymentIdentifier | null);
}

export interface ListPaymentsRequest__Output {
  'identifier': (_greenlight_PaymentIdentifier__Output | null);
}
