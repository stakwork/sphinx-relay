// Original file: proto/greenlight.proto

import type { PayStatus as _greenlight_PayStatus } from '../greenlight/PayStatus';
import type { Amount as _greenlight_Amount, Amount__Output as _greenlight_Amount__Output } from '../greenlight/Amount';

export interface Payment {
  'destination'?: (Buffer | Uint8Array | string);
  'payment_hash'?: (Buffer | Uint8Array | string);
  'payment_preimage'?: (Buffer | Uint8Array | string);
  'status'?: (_greenlight_PayStatus | keyof typeof _greenlight_PayStatus);
  'amount'?: (_greenlight_Amount | null);
  'amount_sent'?: (_greenlight_Amount | null);
}

export interface Payment__Output {
  'destination': (Buffer);
  'payment_hash': (Buffer);
  'payment_preimage': (Buffer);
  'status': (keyof typeof _greenlight_PayStatus);
  'amount': (_greenlight_Amount__Output | null);
  'amount_sent': (_greenlight_Amount__Output | null);
}
