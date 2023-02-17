// Original file: proto/router.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type {
  BuildRouteRequest as _routerrpc_BuildRouteRequest,
  BuildRouteRequest__Output as _routerrpc_BuildRouteRequest__Output,
} from '../routerrpc/BuildRouteRequest'
import type {
  BuildRouteResponse as _routerrpc_BuildRouteResponse,
  BuildRouteResponse__Output as _routerrpc_BuildRouteResponse__Output,
} from '../routerrpc/BuildRouteResponse'
import type {
  ForwardHtlcInterceptRequest as _routerrpc_ForwardHtlcInterceptRequest,
  ForwardHtlcInterceptRequest__Output as _routerrpc_ForwardHtlcInterceptRequest__Output,
} from '../routerrpc/ForwardHtlcInterceptRequest'
import type {
  ForwardHtlcInterceptResponse as _routerrpc_ForwardHtlcInterceptResponse,
  ForwardHtlcInterceptResponse__Output as _routerrpc_ForwardHtlcInterceptResponse__Output,
} from '../routerrpc/ForwardHtlcInterceptResponse'
import type {
  GetMissionControlConfigRequest as _routerrpc_GetMissionControlConfigRequest,
  GetMissionControlConfigRequest__Output as _routerrpc_GetMissionControlConfigRequest__Output,
} from '../routerrpc/GetMissionControlConfigRequest'
import type {
  GetMissionControlConfigResponse as _routerrpc_GetMissionControlConfigResponse,
  GetMissionControlConfigResponse__Output as _routerrpc_GetMissionControlConfigResponse__Output,
} from '../routerrpc/GetMissionControlConfigResponse'
import type {
  HTLCAttempt as _lnrpc_HTLCAttempt,
  HTLCAttempt__Output as _lnrpc_HTLCAttempt__Output,
} from '../lnrpc/HTLCAttempt'
import type {
  HtlcEvent as _routerrpc_HtlcEvent,
  HtlcEvent__Output as _routerrpc_HtlcEvent__Output,
} from '../routerrpc/HtlcEvent'
import type {
  Payment as _lnrpc_Payment,
  Payment__Output as _lnrpc_Payment__Output,
} from '../lnrpc/Payment'
import type {
  PaymentStatus as _routerrpc_PaymentStatus,
  PaymentStatus__Output as _routerrpc_PaymentStatus__Output,
} from '../routerrpc/PaymentStatus'
import type {
  QueryMissionControlRequest as _routerrpc_QueryMissionControlRequest,
  QueryMissionControlRequest__Output as _routerrpc_QueryMissionControlRequest__Output,
} from '../routerrpc/QueryMissionControlRequest'
import type {
  QueryMissionControlResponse as _routerrpc_QueryMissionControlResponse,
  QueryMissionControlResponse__Output as _routerrpc_QueryMissionControlResponse__Output,
} from '../routerrpc/QueryMissionControlResponse'
import type {
  QueryProbabilityRequest as _routerrpc_QueryProbabilityRequest,
  QueryProbabilityRequest__Output as _routerrpc_QueryProbabilityRequest__Output,
} from '../routerrpc/QueryProbabilityRequest'
import type {
  QueryProbabilityResponse as _routerrpc_QueryProbabilityResponse,
  QueryProbabilityResponse__Output as _routerrpc_QueryProbabilityResponse__Output,
} from '../routerrpc/QueryProbabilityResponse'
import type {
  ResetMissionControlRequest as _routerrpc_ResetMissionControlRequest,
  ResetMissionControlRequest__Output as _routerrpc_ResetMissionControlRequest__Output,
} from '../routerrpc/ResetMissionControlRequest'
import type {
  ResetMissionControlResponse as _routerrpc_ResetMissionControlResponse,
  ResetMissionControlResponse__Output as _routerrpc_ResetMissionControlResponse__Output,
} from '../routerrpc/ResetMissionControlResponse'
import type {
  RouteFeeRequest as _routerrpc_RouteFeeRequest,
  RouteFeeRequest__Output as _routerrpc_RouteFeeRequest__Output,
} from '../routerrpc/RouteFeeRequest'
import type {
  RouteFeeResponse as _routerrpc_RouteFeeResponse,
  RouteFeeResponse__Output as _routerrpc_RouteFeeResponse__Output,
} from '../routerrpc/RouteFeeResponse'
import type {
  SendPaymentRequest as _routerrpc_SendPaymentRequest,
  SendPaymentRequest__Output as _routerrpc_SendPaymentRequest__Output,
} from '../routerrpc/SendPaymentRequest'
import type {
  SendToRouteRequest as _routerrpc_SendToRouteRequest,
  SendToRouteRequest__Output as _routerrpc_SendToRouteRequest__Output,
} from '../routerrpc/SendToRouteRequest'
import type {
  SendToRouteResponse as _routerrpc_SendToRouteResponse,
  SendToRouteResponse__Output as _routerrpc_SendToRouteResponse__Output,
} from '../routerrpc/SendToRouteResponse'
import type {
  SetMissionControlConfigRequest as _routerrpc_SetMissionControlConfigRequest,
  SetMissionControlConfigRequest__Output as _routerrpc_SetMissionControlConfigRequest__Output,
} from '../routerrpc/SetMissionControlConfigRequest'
import type {
  SetMissionControlConfigResponse as _routerrpc_SetMissionControlConfigResponse,
  SetMissionControlConfigResponse__Output as _routerrpc_SetMissionControlConfigResponse__Output,
} from '../routerrpc/SetMissionControlConfigResponse'
import type {
  SubscribeHtlcEventsRequest as _routerrpc_SubscribeHtlcEventsRequest,
  SubscribeHtlcEventsRequest__Output as _routerrpc_SubscribeHtlcEventsRequest__Output,
} from '../routerrpc/SubscribeHtlcEventsRequest'
import type {
  TrackPaymentRequest as _routerrpc_TrackPaymentRequest,
  TrackPaymentRequest__Output as _routerrpc_TrackPaymentRequest__Output,
} from '../routerrpc/TrackPaymentRequest'
import type {
  TrackPaymentsRequest as _routerrpc_TrackPaymentsRequest,
  TrackPaymentsRequest__Output as _routerrpc_TrackPaymentsRequest__Output,
} from '../routerrpc/TrackPaymentsRequest'
import type {
  UpdateChanStatusRequest as _routerrpc_UpdateChanStatusRequest,
  UpdateChanStatusRequest__Output as _routerrpc_UpdateChanStatusRequest__Output,
} from '../routerrpc/UpdateChanStatusRequest'
import type {
  UpdateChanStatusResponse as _routerrpc_UpdateChanStatusResponse,
  UpdateChanStatusResponse__Output as _routerrpc_UpdateChanStatusResponse__Output,
} from '../routerrpc/UpdateChanStatusResponse'
import type {
  XImportMissionControlRequest as _routerrpc_XImportMissionControlRequest,
  XImportMissionControlRequest__Output as _routerrpc_XImportMissionControlRequest__Output,
} from '../routerrpc/XImportMissionControlRequest'
import type {
  XImportMissionControlResponse as _routerrpc_XImportMissionControlResponse,
  XImportMissionControlResponse__Output as _routerrpc_XImportMissionControlResponse__Output,
} from '../routerrpc/XImportMissionControlResponse'

export interface RouterClient extends grpc.Client {
  BuildRoute(
    argument: _routerrpc_BuildRouteRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_BuildRouteResponse__Output>
  ): grpc.ClientUnaryCall
  BuildRoute(
    argument: _routerrpc_BuildRouteRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_BuildRouteResponse__Output>
  ): grpc.ClientUnaryCall
  BuildRoute(
    argument: _routerrpc_BuildRouteRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_BuildRouteResponse__Output>
  ): grpc.ClientUnaryCall
  BuildRoute(
    argument: _routerrpc_BuildRouteRequest,
    callback: grpc.requestCallback<_routerrpc_BuildRouteResponse__Output>
  ): grpc.ClientUnaryCall
  buildRoute(
    argument: _routerrpc_BuildRouteRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_BuildRouteResponse__Output>
  ): grpc.ClientUnaryCall
  buildRoute(
    argument: _routerrpc_BuildRouteRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_BuildRouteResponse__Output>
  ): grpc.ClientUnaryCall
  buildRoute(
    argument: _routerrpc_BuildRouteRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_BuildRouteResponse__Output>
  ): grpc.ClientUnaryCall
  buildRoute(
    argument: _routerrpc_BuildRouteRequest,
    callback: grpc.requestCallback<_routerrpc_BuildRouteResponse__Output>
  ): grpc.ClientUnaryCall

  EstimateRouteFee(
    argument: _routerrpc_RouteFeeRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_RouteFeeResponse__Output>
  ): grpc.ClientUnaryCall
  EstimateRouteFee(
    argument: _routerrpc_RouteFeeRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_RouteFeeResponse__Output>
  ): grpc.ClientUnaryCall
  EstimateRouteFee(
    argument: _routerrpc_RouteFeeRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_RouteFeeResponse__Output>
  ): grpc.ClientUnaryCall
  EstimateRouteFee(
    argument: _routerrpc_RouteFeeRequest,
    callback: grpc.requestCallback<_routerrpc_RouteFeeResponse__Output>
  ): grpc.ClientUnaryCall
  estimateRouteFee(
    argument: _routerrpc_RouteFeeRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_RouteFeeResponse__Output>
  ): grpc.ClientUnaryCall
  estimateRouteFee(
    argument: _routerrpc_RouteFeeRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_RouteFeeResponse__Output>
  ): grpc.ClientUnaryCall
  estimateRouteFee(
    argument: _routerrpc_RouteFeeRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_RouteFeeResponse__Output>
  ): grpc.ClientUnaryCall
  estimateRouteFee(
    argument: _routerrpc_RouteFeeRequest,
    callback: grpc.requestCallback<_routerrpc_RouteFeeResponse__Output>
  ): grpc.ClientUnaryCall

  GetMissionControlConfig(
    argument: _routerrpc_GetMissionControlConfigRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_GetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  GetMissionControlConfig(
    argument: _routerrpc_GetMissionControlConfigRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_GetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  GetMissionControlConfig(
    argument: _routerrpc_GetMissionControlConfigRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_GetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  GetMissionControlConfig(
    argument: _routerrpc_GetMissionControlConfigRequest,
    callback: grpc.requestCallback<_routerrpc_GetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  getMissionControlConfig(
    argument: _routerrpc_GetMissionControlConfigRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_GetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  getMissionControlConfig(
    argument: _routerrpc_GetMissionControlConfigRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_GetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  getMissionControlConfig(
    argument: _routerrpc_GetMissionControlConfigRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_GetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  getMissionControlConfig(
    argument: _routerrpc_GetMissionControlConfigRequest,
    callback: grpc.requestCallback<_routerrpc_GetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall

  HtlcInterceptor(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientDuplexStream<
    _routerrpc_ForwardHtlcInterceptResponse,
    _routerrpc_ForwardHtlcInterceptRequest__Output
  >
  HtlcInterceptor(
    options?: grpc.CallOptions
  ): grpc.ClientDuplexStream<
    _routerrpc_ForwardHtlcInterceptResponse,
    _routerrpc_ForwardHtlcInterceptRequest__Output
  >
  htlcInterceptor(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientDuplexStream<
    _routerrpc_ForwardHtlcInterceptResponse,
    _routerrpc_ForwardHtlcInterceptRequest__Output
  >
  htlcInterceptor(
    options?: grpc.CallOptions
  ): grpc.ClientDuplexStream<
    _routerrpc_ForwardHtlcInterceptResponse,
    _routerrpc_ForwardHtlcInterceptRequest__Output
  >

  QueryMissionControl(
    argument: _routerrpc_QueryMissionControlRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_QueryMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  QueryMissionControl(
    argument: _routerrpc_QueryMissionControlRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_QueryMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  QueryMissionControl(
    argument: _routerrpc_QueryMissionControlRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_QueryMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  QueryMissionControl(
    argument: _routerrpc_QueryMissionControlRequest,
    callback: grpc.requestCallback<_routerrpc_QueryMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  queryMissionControl(
    argument: _routerrpc_QueryMissionControlRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_QueryMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  queryMissionControl(
    argument: _routerrpc_QueryMissionControlRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_QueryMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  queryMissionControl(
    argument: _routerrpc_QueryMissionControlRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_QueryMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  queryMissionControl(
    argument: _routerrpc_QueryMissionControlRequest,
    callback: grpc.requestCallback<_routerrpc_QueryMissionControlResponse__Output>
  ): grpc.ClientUnaryCall

  QueryProbability(
    argument: _routerrpc_QueryProbabilityRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_QueryProbabilityResponse__Output>
  ): grpc.ClientUnaryCall
  QueryProbability(
    argument: _routerrpc_QueryProbabilityRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_QueryProbabilityResponse__Output>
  ): grpc.ClientUnaryCall
  QueryProbability(
    argument: _routerrpc_QueryProbabilityRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_QueryProbabilityResponse__Output>
  ): grpc.ClientUnaryCall
  QueryProbability(
    argument: _routerrpc_QueryProbabilityRequest,
    callback: grpc.requestCallback<_routerrpc_QueryProbabilityResponse__Output>
  ): grpc.ClientUnaryCall
  queryProbability(
    argument: _routerrpc_QueryProbabilityRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_QueryProbabilityResponse__Output>
  ): grpc.ClientUnaryCall
  queryProbability(
    argument: _routerrpc_QueryProbabilityRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_QueryProbabilityResponse__Output>
  ): grpc.ClientUnaryCall
  queryProbability(
    argument: _routerrpc_QueryProbabilityRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_QueryProbabilityResponse__Output>
  ): grpc.ClientUnaryCall
  queryProbability(
    argument: _routerrpc_QueryProbabilityRequest,
    callback: grpc.requestCallback<_routerrpc_QueryProbabilityResponse__Output>
  ): grpc.ClientUnaryCall

  ResetMissionControl(
    argument: _routerrpc_ResetMissionControlRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_ResetMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  ResetMissionControl(
    argument: _routerrpc_ResetMissionControlRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_ResetMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  ResetMissionControl(
    argument: _routerrpc_ResetMissionControlRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_ResetMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  ResetMissionControl(
    argument: _routerrpc_ResetMissionControlRequest,
    callback: grpc.requestCallback<_routerrpc_ResetMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  resetMissionControl(
    argument: _routerrpc_ResetMissionControlRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_ResetMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  resetMissionControl(
    argument: _routerrpc_ResetMissionControlRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_ResetMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  resetMissionControl(
    argument: _routerrpc_ResetMissionControlRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_ResetMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  resetMissionControl(
    argument: _routerrpc_ResetMissionControlRequest,
    callback: grpc.requestCallback<_routerrpc_ResetMissionControlResponse__Output>
  ): grpc.ClientUnaryCall

  SendPayment(
    argument: _routerrpc_SendPaymentRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_PaymentStatus__Output>
  SendPayment(
    argument: _routerrpc_SendPaymentRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_PaymentStatus__Output>
  sendPayment(
    argument: _routerrpc_SendPaymentRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_PaymentStatus__Output>
  sendPayment(
    argument: _routerrpc_SendPaymentRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_PaymentStatus__Output>

  SendPaymentV2(
    argument: _routerrpc_SendPaymentRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>
  SendPaymentV2(
    argument: _routerrpc_SendPaymentRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>
  sendPaymentV2(
    argument: _routerrpc_SendPaymentRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>
  sendPaymentV2(
    argument: _routerrpc_SendPaymentRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>

  SendToRoute(
    argument: _routerrpc_SendToRouteRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_SendToRouteResponse__Output>
  ): grpc.ClientUnaryCall
  SendToRoute(
    argument: _routerrpc_SendToRouteRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_SendToRouteResponse__Output>
  ): grpc.ClientUnaryCall
  SendToRoute(
    argument: _routerrpc_SendToRouteRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_SendToRouteResponse__Output>
  ): grpc.ClientUnaryCall
  SendToRoute(
    argument: _routerrpc_SendToRouteRequest,
    callback: grpc.requestCallback<_routerrpc_SendToRouteResponse__Output>
  ): grpc.ClientUnaryCall
  sendToRoute(
    argument: _routerrpc_SendToRouteRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_SendToRouteResponse__Output>
  ): grpc.ClientUnaryCall
  sendToRoute(
    argument: _routerrpc_SendToRouteRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_SendToRouteResponse__Output>
  ): grpc.ClientUnaryCall
  sendToRoute(
    argument: _routerrpc_SendToRouteRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_SendToRouteResponse__Output>
  ): grpc.ClientUnaryCall
  sendToRoute(
    argument: _routerrpc_SendToRouteRequest,
    callback: grpc.requestCallback<_routerrpc_SendToRouteResponse__Output>
  ): grpc.ClientUnaryCall

  SendToRouteV2(
    argument: _routerrpc_SendToRouteRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_HTLCAttempt__Output>
  ): grpc.ClientUnaryCall
  SendToRouteV2(
    argument: _routerrpc_SendToRouteRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_HTLCAttempt__Output>
  ): grpc.ClientUnaryCall
  SendToRouteV2(
    argument: _routerrpc_SendToRouteRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_HTLCAttempt__Output>
  ): grpc.ClientUnaryCall
  SendToRouteV2(
    argument: _routerrpc_SendToRouteRequest,
    callback: grpc.requestCallback<_lnrpc_HTLCAttempt__Output>
  ): grpc.ClientUnaryCall
  sendToRouteV2(
    argument: _routerrpc_SendToRouteRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_HTLCAttempt__Output>
  ): grpc.ClientUnaryCall
  sendToRouteV2(
    argument: _routerrpc_SendToRouteRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_HTLCAttempt__Output>
  ): grpc.ClientUnaryCall
  sendToRouteV2(
    argument: _routerrpc_SendToRouteRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_HTLCAttempt__Output>
  ): grpc.ClientUnaryCall
  sendToRouteV2(
    argument: _routerrpc_SendToRouteRequest,
    callback: grpc.requestCallback<_lnrpc_HTLCAttempt__Output>
  ): grpc.ClientUnaryCall

  SetMissionControlConfig(
    argument: _routerrpc_SetMissionControlConfigRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_SetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  SetMissionControlConfig(
    argument: _routerrpc_SetMissionControlConfigRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_SetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  SetMissionControlConfig(
    argument: _routerrpc_SetMissionControlConfigRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_SetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  SetMissionControlConfig(
    argument: _routerrpc_SetMissionControlConfigRequest,
    callback: grpc.requestCallback<_routerrpc_SetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  setMissionControlConfig(
    argument: _routerrpc_SetMissionControlConfigRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_SetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  setMissionControlConfig(
    argument: _routerrpc_SetMissionControlConfigRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_SetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  setMissionControlConfig(
    argument: _routerrpc_SetMissionControlConfigRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_SetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall
  setMissionControlConfig(
    argument: _routerrpc_SetMissionControlConfigRequest,
    callback: grpc.requestCallback<_routerrpc_SetMissionControlConfigResponse__Output>
  ): grpc.ClientUnaryCall

  SubscribeHtlcEvents(
    argument: _routerrpc_SubscribeHtlcEventsRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_HtlcEvent__Output>
  SubscribeHtlcEvents(
    argument: _routerrpc_SubscribeHtlcEventsRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_HtlcEvent__Output>
  subscribeHtlcEvents(
    argument: _routerrpc_SubscribeHtlcEventsRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_HtlcEvent__Output>
  subscribeHtlcEvents(
    argument: _routerrpc_SubscribeHtlcEventsRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_HtlcEvent__Output>

  TrackPayment(
    argument: _routerrpc_TrackPaymentRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_PaymentStatus__Output>
  TrackPayment(
    argument: _routerrpc_TrackPaymentRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_PaymentStatus__Output>
  trackPayment(
    argument: _routerrpc_TrackPaymentRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_PaymentStatus__Output>
  trackPayment(
    argument: _routerrpc_TrackPaymentRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_routerrpc_PaymentStatus__Output>

  TrackPaymentV2(
    argument: _routerrpc_TrackPaymentRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>
  TrackPaymentV2(
    argument: _routerrpc_TrackPaymentRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>
  trackPaymentV2(
    argument: _routerrpc_TrackPaymentRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>
  trackPaymentV2(
    argument: _routerrpc_TrackPaymentRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>

  TrackPayments(
    argument: _routerrpc_TrackPaymentsRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>
  TrackPayments(
    argument: _routerrpc_TrackPaymentsRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>
  trackPayments(
    argument: _routerrpc_TrackPaymentsRequest,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>
  trackPayments(
    argument: _routerrpc_TrackPaymentsRequest,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_Payment__Output>

  UpdateChanStatus(
    argument: _routerrpc_UpdateChanStatusRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_UpdateChanStatusResponse__Output>
  ): grpc.ClientUnaryCall
  UpdateChanStatus(
    argument: _routerrpc_UpdateChanStatusRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_UpdateChanStatusResponse__Output>
  ): grpc.ClientUnaryCall
  UpdateChanStatus(
    argument: _routerrpc_UpdateChanStatusRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_UpdateChanStatusResponse__Output>
  ): grpc.ClientUnaryCall
  UpdateChanStatus(
    argument: _routerrpc_UpdateChanStatusRequest,
    callback: grpc.requestCallback<_routerrpc_UpdateChanStatusResponse__Output>
  ): grpc.ClientUnaryCall
  updateChanStatus(
    argument: _routerrpc_UpdateChanStatusRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_UpdateChanStatusResponse__Output>
  ): grpc.ClientUnaryCall
  updateChanStatus(
    argument: _routerrpc_UpdateChanStatusRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_UpdateChanStatusResponse__Output>
  ): grpc.ClientUnaryCall
  updateChanStatus(
    argument: _routerrpc_UpdateChanStatusRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_UpdateChanStatusResponse__Output>
  ): grpc.ClientUnaryCall
  updateChanStatus(
    argument: _routerrpc_UpdateChanStatusRequest,
    callback: grpc.requestCallback<_routerrpc_UpdateChanStatusResponse__Output>
  ): grpc.ClientUnaryCall

  XImportMissionControl(
    argument: _routerrpc_XImportMissionControlRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_XImportMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  XImportMissionControl(
    argument: _routerrpc_XImportMissionControlRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_XImportMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  XImportMissionControl(
    argument: _routerrpc_XImportMissionControlRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_XImportMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  XImportMissionControl(
    argument: _routerrpc_XImportMissionControlRequest,
    callback: grpc.requestCallback<_routerrpc_XImportMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  xImportMissionControl(
    argument: _routerrpc_XImportMissionControlRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_XImportMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  xImportMissionControl(
    argument: _routerrpc_XImportMissionControlRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_routerrpc_XImportMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  xImportMissionControl(
    argument: _routerrpc_XImportMissionControlRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_routerrpc_XImportMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
  xImportMissionControl(
    argument: _routerrpc_XImportMissionControlRequest,
    callback: grpc.requestCallback<_routerrpc_XImportMissionControlResponse__Output>
  ): grpc.ClientUnaryCall
}

export interface RouterHandlers extends grpc.UntypedServiceImplementation {
  BuildRoute: grpc.handleUnaryCall<
    _routerrpc_BuildRouteRequest__Output,
    _routerrpc_BuildRouteResponse
  >

  EstimateRouteFee: grpc.handleUnaryCall<
    _routerrpc_RouteFeeRequest__Output,
    _routerrpc_RouteFeeResponse
  >

  GetMissionControlConfig: grpc.handleUnaryCall<
    _routerrpc_GetMissionControlConfigRequest__Output,
    _routerrpc_GetMissionControlConfigResponse
  >

  HtlcInterceptor: grpc.handleBidiStreamingCall<
    _routerrpc_ForwardHtlcInterceptResponse__Output,
    _routerrpc_ForwardHtlcInterceptRequest
  >

  QueryMissionControl: grpc.handleUnaryCall<
    _routerrpc_QueryMissionControlRequest__Output,
    _routerrpc_QueryMissionControlResponse
  >

  QueryProbability: grpc.handleUnaryCall<
    _routerrpc_QueryProbabilityRequest__Output,
    _routerrpc_QueryProbabilityResponse
  >

  ResetMissionControl: grpc.handleUnaryCall<
    _routerrpc_ResetMissionControlRequest__Output,
    _routerrpc_ResetMissionControlResponse
  >

  SendPayment: grpc.handleServerStreamingCall<
    _routerrpc_SendPaymentRequest__Output,
    _routerrpc_PaymentStatus
  >

  SendPaymentV2: grpc.handleServerStreamingCall<
    _routerrpc_SendPaymentRequest__Output,
    _lnrpc_Payment
  >

  SendToRoute: grpc.handleUnaryCall<
    _routerrpc_SendToRouteRequest__Output,
    _routerrpc_SendToRouteResponse
  >

  SendToRouteV2: grpc.handleUnaryCall<
    _routerrpc_SendToRouteRequest__Output,
    _lnrpc_HTLCAttempt
  >

  SetMissionControlConfig: grpc.handleUnaryCall<
    _routerrpc_SetMissionControlConfigRequest__Output,
    _routerrpc_SetMissionControlConfigResponse
  >

  SubscribeHtlcEvents: grpc.handleServerStreamingCall<
    _routerrpc_SubscribeHtlcEventsRequest__Output,
    _routerrpc_HtlcEvent
  >

  TrackPayment: grpc.handleServerStreamingCall<
    _routerrpc_TrackPaymentRequest__Output,
    _routerrpc_PaymentStatus
  >

  TrackPaymentV2: grpc.handleServerStreamingCall<
    _routerrpc_TrackPaymentRequest__Output,
    _lnrpc_Payment
  >

  TrackPayments: grpc.handleServerStreamingCall<
    _routerrpc_TrackPaymentsRequest__Output,
    _lnrpc_Payment
  >

  UpdateChanStatus: grpc.handleUnaryCall<
    _routerrpc_UpdateChanStatusRequest__Output,
    _routerrpc_UpdateChanStatusResponse
  >

  XImportMissionControl: grpc.handleUnaryCall<
    _routerrpc_XImportMissionControlRequest__Output,
    _routerrpc_XImportMissionControlResponse
  >
}

export interface RouterDefinition extends grpc.ServiceDefinition {
  BuildRoute: MethodDefinition<
    _routerrpc_BuildRouteRequest,
    _routerrpc_BuildRouteResponse,
    _routerrpc_BuildRouteRequest__Output,
    _routerrpc_BuildRouteResponse__Output
  >
  EstimateRouteFee: MethodDefinition<
    _routerrpc_RouteFeeRequest,
    _routerrpc_RouteFeeResponse,
    _routerrpc_RouteFeeRequest__Output,
    _routerrpc_RouteFeeResponse__Output
  >
  GetMissionControlConfig: MethodDefinition<
    _routerrpc_GetMissionControlConfigRequest,
    _routerrpc_GetMissionControlConfigResponse,
    _routerrpc_GetMissionControlConfigRequest__Output,
    _routerrpc_GetMissionControlConfigResponse__Output
  >
  HtlcInterceptor: MethodDefinition<
    _routerrpc_ForwardHtlcInterceptResponse,
    _routerrpc_ForwardHtlcInterceptRequest,
    _routerrpc_ForwardHtlcInterceptResponse__Output,
    _routerrpc_ForwardHtlcInterceptRequest__Output
  >
  QueryMissionControl: MethodDefinition<
    _routerrpc_QueryMissionControlRequest,
    _routerrpc_QueryMissionControlResponse,
    _routerrpc_QueryMissionControlRequest__Output,
    _routerrpc_QueryMissionControlResponse__Output
  >
  QueryProbability: MethodDefinition<
    _routerrpc_QueryProbabilityRequest,
    _routerrpc_QueryProbabilityResponse,
    _routerrpc_QueryProbabilityRequest__Output,
    _routerrpc_QueryProbabilityResponse__Output
  >
  ResetMissionControl: MethodDefinition<
    _routerrpc_ResetMissionControlRequest,
    _routerrpc_ResetMissionControlResponse,
    _routerrpc_ResetMissionControlRequest__Output,
    _routerrpc_ResetMissionControlResponse__Output
  >
  SendPayment: MethodDefinition<
    _routerrpc_SendPaymentRequest,
    _routerrpc_PaymentStatus,
    _routerrpc_SendPaymentRequest__Output,
    _routerrpc_PaymentStatus__Output
  >
  SendPaymentV2: MethodDefinition<
    _routerrpc_SendPaymentRequest,
    _lnrpc_Payment,
    _routerrpc_SendPaymentRequest__Output,
    _lnrpc_Payment__Output
  >
  SendToRoute: MethodDefinition<
    _routerrpc_SendToRouteRequest,
    _routerrpc_SendToRouteResponse,
    _routerrpc_SendToRouteRequest__Output,
    _routerrpc_SendToRouteResponse__Output
  >
  SendToRouteV2: MethodDefinition<
    _routerrpc_SendToRouteRequest,
    _lnrpc_HTLCAttempt,
    _routerrpc_SendToRouteRequest__Output,
    _lnrpc_HTLCAttempt__Output
  >
  SetMissionControlConfig: MethodDefinition<
    _routerrpc_SetMissionControlConfigRequest,
    _routerrpc_SetMissionControlConfigResponse,
    _routerrpc_SetMissionControlConfigRequest__Output,
    _routerrpc_SetMissionControlConfigResponse__Output
  >
  SubscribeHtlcEvents: MethodDefinition<
    _routerrpc_SubscribeHtlcEventsRequest,
    _routerrpc_HtlcEvent,
    _routerrpc_SubscribeHtlcEventsRequest__Output,
    _routerrpc_HtlcEvent__Output
  >
  TrackPayment: MethodDefinition<
    _routerrpc_TrackPaymentRequest,
    _routerrpc_PaymentStatus,
    _routerrpc_TrackPaymentRequest__Output,
    _routerrpc_PaymentStatus__Output
  >
  TrackPaymentV2: MethodDefinition<
    _routerrpc_TrackPaymentRequest,
    _lnrpc_Payment,
    _routerrpc_TrackPaymentRequest__Output,
    _lnrpc_Payment__Output
  >
  TrackPayments: MethodDefinition<
    _routerrpc_TrackPaymentsRequest,
    _lnrpc_Payment,
    _routerrpc_TrackPaymentsRequest__Output,
    _lnrpc_Payment__Output
  >
  UpdateChanStatus: MethodDefinition<
    _routerrpc_UpdateChanStatusRequest,
    _routerrpc_UpdateChanStatusResponse,
    _routerrpc_UpdateChanStatusRequest__Output,
    _routerrpc_UpdateChanStatusResponse__Output
  >
  XImportMissionControl: MethodDefinition<
    _routerrpc_XImportMissionControlRequest,
    _routerrpc_XImportMissionControlResponse,
    _routerrpc_XImportMissionControlRequest__Output,
    _routerrpc_XImportMissionControlResponse__Output
  >
}
