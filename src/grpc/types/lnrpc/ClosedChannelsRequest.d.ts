// Original file: proto/lightning.proto

export interface ClosedChannelsRequest {
  cooperative?: boolean
  local_force?: boolean
  remote_force?: boolean
  breach?: boolean
  funding_canceled?: boolean
  abandoned?: boolean
}

export interface ClosedChannelsRequest__Output {
  cooperative: boolean
  local_force: boolean
  remote_force: boolean
  breach: boolean
  funding_canceled: boolean
  abandoned: boolean
}
