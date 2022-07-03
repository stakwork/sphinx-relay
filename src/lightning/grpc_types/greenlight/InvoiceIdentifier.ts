// Original file: proto/greenlight.proto


export interface InvoiceIdentifier {
  'label'?: (string);
  'invstring'?: (string);
  'payment_hash'?: (Buffer | Uint8Array | string);
  'id'?: "label"|"invstring"|"payment_hash";
}

export interface InvoiceIdentifier__Output {
  'label'?: (string);
  'invstring'?: (string);
  'payment_hash'?: (Buffer);
  'id': "label"|"invstring"|"payment_hash";
}
