// Original file: proto/greenlight.proto

import type {
  InvoiceIdentifier as _greenlight_InvoiceIdentifier,
  InvoiceIdentifier__Output as _greenlight_InvoiceIdentifier__Output,
} from '../greenlight/InvoiceIdentifier'

export interface ListInvoicesRequest {
  identifier?: _greenlight_InvoiceIdentifier | null
}

export interface ListInvoicesRequest__Output {
  identifier: _greenlight_InvoiceIdentifier__Output | null
}
