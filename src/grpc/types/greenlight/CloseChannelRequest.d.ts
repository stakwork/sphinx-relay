// Original file: proto/greenlight.proto

import type {
  Timeout as _greenlight_Timeout,
  Timeout__Output as _greenlight_Timeout__Output,
} from '../greenlight/Timeout'
import type {
  BitcoinAddress as _greenlight_BitcoinAddress,
  BitcoinAddress__Output as _greenlight_BitcoinAddress__Output,
} from '../greenlight/BitcoinAddress'

export interface CloseChannelRequest {
  node_id?: Buffer | Uint8Array | string
  unilateraltimeout?: _greenlight_Timeout | null
  destination?: _greenlight_BitcoinAddress | null
}

export interface CloseChannelRequest__Output {
  node_id: Buffer
  unilateraltimeout: _greenlight_Timeout__Output | null
  destination: _greenlight_BitcoinAddress__Output | null
}
