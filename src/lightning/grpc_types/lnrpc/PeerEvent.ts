// Original file: proto/lightning.proto


// Original file: proto/lightning.proto

export enum _lnrpc_PeerEvent_EventType {
  PEER_ONLINE = 0,
  PEER_OFFLINE = 1,
}

export interface PeerEvent {
  'pub_key'?: (string);
  'type'?: (_lnrpc_PeerEvent_EventType | keyof typeof _lnrpc_PeerEvent_EventType);
}

export interface PeerEvent__Output {
  'pub_key': (string);
  'type': (keyof typeof _lnrpc_PeerEvent_EventType);
}
