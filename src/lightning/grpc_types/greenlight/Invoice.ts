// Original file: proto/greenlight.proto

import type { Amount as _greenlight_Amount, Amount__Output as _greenlight_Amount__Output } from '../greenlight/Amount';
import type { InvoiceStatus as _greenlight_InvoiceStatus } from '../greenlight/InvoiceStatus';

export interface Invoice {
  'label'?: (string);
  'description'?: (string);
  'amount'?: (_greenlight_Amount | null);
  'received'?: (_greenlight_Amount | null);
  'status'?: (_greenlight_InvoiceStatus | keyof typeof _greenlight_InvoiceStatus);
  'payment_time'?: (number);
  'expiry_time'?: (number);
  'bolt11'?: (string);
  'payment_hash'?: (Buffer | Uint8Array | string);
  'payment_preimage'?: (Buffer | Uint8Array | string);
}

export interface Invoice__Output {
  'label': (string);
  'description': (string);
  'amount': (_greenlight_Amount__Output | null);
  'received': (_greenlight_Amount__Output | null);
  'status': (keyof typeof _greenlight_InvoiceStatus);
  'payment_time': (number);
  'expiry_time': (number);
  'bolt11': (string);
  'payment_hash': (Buffer);
  'payment_preimage': (Buffer);
}
