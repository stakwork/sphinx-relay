// Original file: proto/walletkit.proto


export interface LabelTransactionRequest {
  'txid'?: (Buffer | Uint8Array | string);
  'label'?: (string);
  'overwrite'?: (boolean);
}

export interface LabelTransactionRequest__Output {
  'txid': (Buffer);
  'label': (string);
  'overwrite': (boolean);
}
