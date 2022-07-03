// Original file: proto/greenlight.proto

import type { NetAddressType as _greenlight_NetAddressType } from '../greenlight/NetAddressType';

export interface Address {
  'type'?: (_greenlight_NetAddressType | keyof typeof _greenlight_NetAddressType);
  'addr'?: (string);
  'port'?: (number);
}

export interface Address__Output {
  'type': (keyof typeof _greenlight_NetAddressType);
  'addr': (string);
  'port': (number);
}
