// Original file: proto/greenlight.proto

import type { Amount as _greenlight_Amount, Amount__Output as _greenlight_Amount__Output } from '../greenlight/Amount';

export interface InvoiceRequest {
  'amount'?: (_greenlight_Amount | null);
  'label'?: (string);
  'description'?: (string);
}

export interface InvoiceRequest__Output {
  'amount': (_greenlight_Amount__Output | null);
  'label': (string);
  'description': (string);
}
