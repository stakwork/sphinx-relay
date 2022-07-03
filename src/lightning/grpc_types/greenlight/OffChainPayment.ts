// Original file: proto/greenlight.proto

import type { Amount as _greenlight_Amount, Amount__Output as _greenlight_Amount__Output } from '../greenlight/Amount';
import type { TlvField as _greenlight_TlvField, TlvField__Output as _greenlight_TlvField__Output } from '../greenlight/TlvField';

export interface OffChainPayment {
  'label'?: (string);
  'preimage'?: (Buffer | Uint8Array | string);
  'amount'?: (_greenlight_Amount | null);
  'extratlvs'?: (_greenlight_TlvField)[];
  'payment_hash'?: (Buffer | Uint8Array | string);
  'bolt11'?: (string);
}

export interface OffChainPayment__Output {
  'label': (string);
  'preimage': (Buffer);
  'amount': (_greenlight_Amount__Output | null);
  'extratlvs': (_greenlight_TlvField__Output)[];
  'payment_hash': (Buffer);
  'bolt11': (string);
}
