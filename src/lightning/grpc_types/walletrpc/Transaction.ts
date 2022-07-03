// Original file: proto/walletkit.proto


export interface Transaction {
  'tx_hex'?: (Buffer | Uint8Array | string);
  'label'?: (string);
}

export interface Transaction__Output {
  'tx_hex': (Buffer);
  'label': (string);
}
