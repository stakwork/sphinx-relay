// Original file: proto/greenlight.proto

import type { Amount as _greenlight_Amount, Amount__Output as _greenlight_Amount__Output } from '../greenlight/Amount';

export interface PayRequest {
  'bolt11'?: (string);
  'amount'?: (_greenlight_Amount | null);
  'timeout'?: (number);
}

export interface PayRequest__Output {
  'bolt11': (string);
  'amount': (_greenlight_Amount__Output | null);
  'timeout': (number);
}
