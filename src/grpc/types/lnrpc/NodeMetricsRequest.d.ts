// Original file: proto/lightning.proto

import type {
  NodeMetricType as _lnrpc_NodeMetricType,
  NodeMetricType__Output as _lnrpc_NodeMetricType__Output,
} from '../lnrpc/NodeMetricType'

export interface NodeMetricsRequest {
  types?: _lnrpc_NodeMetricType[]
}

export interface NodeMetricsRequest__Output {
  types: _lnrpc_NodeMetricType__Output[]
}
