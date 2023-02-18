// Original file: proto/lightning.proto

// Original file: proto/lightning.proto

export const _lnrpc_PeerEvent_EventType = {
  PEER_ONLINE: 'PEER_ONLINE',
  PEER_OFFLINE: 'PEER_OFFLINE',
} as const

export type _lnrpc_PeerEvent_EventType = 'PEER_ONLINE' | 0 | 'PEER_OFFLINE' | 1

export type _lnrpc_PeerEvent_EventType__Output =
  typeof _lnrpc_PeerEvent_EventType[keyof typeof _lnrpc_PeerEvent_EventType]

export interface PeerEvent {
  pub_key?: string
  type?: _lnrpc_PeerEvent_EventType
}

export interface PeerEvent__Output {
  pub_key: string
  type: _lnrpc_PeerEvent_EventType__Output
}
