// Original file: proto/lightning.proto

import type { Long } from '@grpc/proto-loader'

export interface NetworkInfo {
  graph_diameter?: number
  avg_out_degree?: number | string
  max_out_degree?: number
  num_nodes?: number
  num_channels?: number
  total_network_capacity?: number | string | Long
  avg_channel_size?: number | string
  min_channel_size?: number | string | Long
  max_channel_size?: number | string | Long
  median_channel_size_sat?: number | string | Long
  num_zombie_chans?: number | string | Long
}

export interface NetworkInfo__Output {
  graph_diameter: number
  avg_out_degree: number
  max_out_degree: number
  num_nodes: number
  num_channels: number
  total_network_capacity: string
  avg_channel_size: number
  min_channel_size: string
  max_channel_size: string
  median_channel_size_sat: string
  num_zombie_chans: string
}
