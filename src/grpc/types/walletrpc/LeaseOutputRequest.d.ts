// Original file: proto/walletkit.proto

import type {
  OutPoint as _lnrpc_OutPoint,
  OutPoint__Output as _lnrpc_OutPoint__Output,
} from '../lnrpc/OutPoint'
import type { Long } from '@grpc/proto-loader'

export interface LeaseOutputRequest {
  id?: Buffer | Uint8Array | string
  outpoint?: _lnrpc_OutPoint | null
  expiration_seconds?: number | string | Long
}

export interface LeaseOutputRequest__Output {
  id: Buffer
  outpoint: _lnrpc_OutPoint__Output | null
  expiration_seconds: string
}
