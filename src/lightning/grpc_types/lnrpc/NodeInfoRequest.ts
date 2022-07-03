// Original file: proto/lightning.proto


export interface NodeInfoRequest {
  'pub_key'?: (string);
  'include_channels'?: (boolean);
}

export interface NodeInfoRequest__Output {
  'pub_key': (string);
  'include_channels': (boolean);
}
