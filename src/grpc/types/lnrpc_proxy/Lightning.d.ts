// Original file: proto/rpc_proxy.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type {
  AddInvoiceResponse as _lnrpc_proxy_AddInvoiceResponse,
  AddInvoiceResponse__Output as _lnrpc_proxy_AddInvoiceResponse__Output,
} from '../lnrpc_proxy/AddInvoiceResponse'
import type {
  ChanInfoRequest as _lnrpc_proxy_ChanInfoRequest,
  ChanInfoRequest__Output as _lnrpc_proxy_ChanInfoRequest__Output,
} from '../lnrpc_proxy/ChanInfoRequest'
import type {
  ChannelBalanceRequest as _lnrpc_proxy_ChannelBalanceRequest,
  ChannelBalanceRequest__Output as _lnrpc_proxy_ChannelBalanceRequest__Output,
} from '../lnrpc_proxy/ChannelBalanceRequest'
import type {
  ChannelBalanceResponse as _lnrpc_proxy_ChannelBalanceResponse,
  ChannelBalanceResponse__Output as _lnrpc_proxy_ChannelBalanceResponse__Output,
} from '../lnrpc_proxy/ChannelBalanceResponse'
import type {
  ChannelEdge as _lnrpc_proxy_ChannelEdge,
  ChannelEdge__Output as _lnrpc_proxy_ChannelEdge__Output,
} from '../lnrpc_proxy/ChannelEdge'
import type {
  GetInfoRequest as _lnrpc_proxy_GetInfoRequest,
  GetInfoRequest__Output as _lnrpc_proxy_GetInfoRequest__Output,
} from '../lnrpc_proxy/GetInfoRequest'
import type {
  GetInfoResponse as _lnrpc_proxy_GetInfoResponse,
  GetInfoResponse__Output as _lnrpc_proxy_GetInfoResponse__Output,
} from '../lnrpc_proxy/GetInfoResponse'
import type {
  Invoice as _lnrpc_proxy_Invoice,
  Invoice__Output as _lnrpc_proxy_Invoice__Output,
} from '../lnrpc_proxy/Invoice'
import type {
  InvoiceSubscription as _lnrpc_proxy_InvoiceSubscription,
  InvoiceSubscription__Output as _lnrpc_proxy_InvoiceSubscription__Output,
} from '../lnrpc_proxy/InvoiceSubscription'
import type {
  ListChannelsRequest as _lnrpc_proxy_ListChannelsRequest,
  ListChannelsRequest__Output as _lnrpc_proxy_ListChannelsRequest__Output,
} from '../lnrpc_proxy/ListChannelsRequest'
import type {
  ListChannelsResponse as _lnrpc_proxy_ListChannelsResponse,
  ListChannelsResponse__Output as _lnrpc_proxy_ListChannelsResponse__Output,
} from '../lnrpc_proxy/ListChannelsResponse'
import type {
  PaymentHash as _lnrpc_proxy_PaymentHash,
  PaymentHash__Output as _lnrpc_proxy_PaymentHash__Output,
} from '../lnrpc_proxy/PaymentHash'
import type {
  QueryRoutesRequest as _lnrpc_proxy_QueryRoutesRequest,
  QueryRoutesRequest__Output as _lnrpc_proxy_QueryRoutesRequest__Output,
} from '../lnrpc_proxy/QueryRoutesRequest'
import type {
  QueryRoutesResponse as _lnrpc_proxy_QueryRoutesResponse,
  QueryRoutesResponse__Output as _lnrpc_proxy_QueryRoutesResponse__Output,
} from '../lnrpc_proxy/QueryRoutesResponse'
import type {
  SendRequest as _lnrpc_proxy_SendRequest,
  SendRequest__Output as _lnrpc_proxy_SendRequest__Output,
} from '../lnrpc_proxy/SendRequest'
import type {
  SendResponse as _lnrpc_proxy_SendResponse,
  SendResponse__Output as _lnrpc_proxy_SendResponse__Output,
} from '../lnrpc_proxy/SendResponse'
import type {
  SignMessageRequest as _lnrpc_proxy_SignMessageRequest,
  SignMessageRequest__Output as _lnrpc_proxy_SignMessageRequest__Output,
} from '../lnrpc_proxy/SignMessageRequest'
import type {
  SignMessageResponse as _lnrpc_proxy_SignMessageResponse,
  SignMessageResponse__Output as _lnrpc_proxy_SignMessageResponse__Output,
} from '../lnrpc_proxy/SignMessageResponse'
import type {
  VerifyMessageRequest as _lnrpc_proxy_VerifyMessageRequest,
  VerifyMessageRequest__Output as _lnrpc_proxy_VerifyMessageRequest__Output,
} from '../lnrpc_proxy/VerifyMessageRequest'
import type {
  VerifyMessageResponse as _lnrpc_proxy_VerifyMessageResponse,
  VerifyMessageResponse__Output as _lnrpc_proxy_VerifyMessageResponse__Output,
} from '../lnrpc_proxy/VerifyMessageResponse'

export interface LightningClient extends grpc.Client {
  AddInvoice(
    argument: _lnrpc_proxy_Invoice,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_AddInvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  AddInvoice(
    argument: _lnrpc_proxy_Invoice,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_AddInvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  AddInvoice(
    argument: _lnrpc_proxy_Invoice,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_AddInvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  AddInvoice(
    argument: _lnrpc_proxy_Invoice,
    callback: grpc.requestCallback<_lnrpc_proxy_AddInvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  addInvoice(
    argument: _lnrpc_proxy_Invoice,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_AddInvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  addInvoice(
    argument: _lnrpc_proxy_Invoice,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_AddInvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  addInvoice(
    argument: _lnrpc_proxy_Invoice,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_AddInvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  addInvoice(
    argument: _lnrpc_proxy_Invoice,
    callback: grpc.requestCallback<_lnrpc_proxy_AddInvoiceResponse__Output>
  ): grpc.ClientUnaryCall

  ChannelBalance(
    argument: _lnrpc_proxy_ChannelBalanceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelBalanceResponse__Output>
  ): grpc.ClientUnaryCall
  ChannelBalance(
    argument: _lnrpc_proxy_ChannelBalanceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelBalanceResponse__Output>
  ): grpc.ClientUnaryCall
  ChannelBalance(
    argument: _lnrpc_proxy_ChannelBalanceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelBalanceResponse__Output>
  ): grpc.ClientUnaryCall
  ChannelBalance(
    argument: _lnrpc_proxy_ChannelBalanceRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelBalanceResponse__Output>
  ): grpc.ClientUnaryCall
  channelBalance(
    argument: _lnrpc_proxy_ChannelBalanceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelBalanceResponse__Output>
  ): grpc.ClientUnaryCall
  channelBalance(
    argument: _lnrpc_proxy_ChannelBalanceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelBalanceResponse__Output>
  ): grpc.ClientUnaryCall
  channelBalance(
    argument: _lnrpc_proxy_ChannelBalanceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelBalanceResponse__Output>
  ): grpc.ClientUnaryCall
  channelBalance(
    argument: _lnrpc_proxy_ChannelBalanceRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelBalanceResponse__Output>
  ): grpc.ClientUnaryCall

  GetChanInfo(
    argument: _lnrpc_proxy_ChanInfoRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelEdge__Output>
  ): grpc.ClientUnaryCall
  GetChanInfo(
    argument: _lnrpc_proxy_ChanInfoRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelEdge__Output>
  ): grpc.ClientUnaryCall
  GetChanInfo(
    argument: _lnrpc_proxy_ChanInfoRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelEdge__Output>
  ): grpc.ClientUnaryCall
  GetChanInfo(
    argument: _lnrpc_proxy_ChanInfoRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelEdge__Output>
  ): grpc.ClientUnaryCall
  getChanInfo(
    argument: _lnrpc_proxy_ChanInfoRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelEdge__Output>
  ): grpc.ClientUnaryCall
  getChanInfo(
    argument: _lnrpc_proxy_ChanInfoRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelEdge__Output>
  ): grpc.ClientUnaryCall
  getChanInfo(
    argument: _lnrpc_proxy_ChanInfoRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelEdge__Output>
  ): grpc.ClientUnaryCall
  getChanInfo(
    argument: _lnrpc_proxy_ChanInfoRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_ChannelEdge__Output>
  ): grpc.ClientUnaryCall

  GetInfo(
    argument: _lnrpc_proxy_GetInfoRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  GetInfo(
    argument: _lnrpc_proxy_GetInfoRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  GetInfo(
    argument: _lnrpc_proxy_GetInfoRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  GetInfo(
    argument: _lnrpc_proxy_GetInfoRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  getInfo(
    argument: _lnrpc_proxy_GetInfoRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  getInfo(
    argument: _lnrpc_proxy_GetInfoRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  getInfo(
    argument: _lnrpc_proxy_GetInfoRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  getInfo(
    argument: _lnrpc_proxy_GetInfoRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall

  ListChannels(
    argument: _lnrpc_proxy_ListChannelsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ListChannelsResponse__Output>
  ): grpc.ClientUnaryCall
  ListChannels(
    argument: _lnrpc_proxy_ListChannelsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_ListChannelsResponse__Output>
  ): grpc.ClientUnaryCall
  ListChannels(
    argument: _lnrpc_proxy_ListChannelsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ListChannelsResponse__Output>
  ): grpc.ClientUnaryCall
  ListChannels(
    argument: _lnrpc_proxy_ListChannelsRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_ListChannelsResponse__Output>
  ): grpc.ClientUnaryCall
  listChannels(
    argument: _lnrpc_proxy_ListChannelsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ListChannelsResponse__Output>
  ): grpc.ClientUnaryCall
  listChannels(
    argument: _lnrpc_proxy_ListChannelsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_ListChannelsResponse__Output>
  ): grpc.ClientUnaryCall
  listChannels(
    argument: _lnrpc_proxy_ListChannelsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_ListChannelsResponse__Output>
  ): grpc.ClientUnaryCall
  listChannels(
    argument: _lnrpc_proxy_ListChannelsRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_ListChannelsResponse__Output>
  ): grpc.ClientUnaryCall

  LookupInvoice(
    argument: _lnrpc_proxy_PaymentHash,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_Invoice__Output>
  ): grpc.ClientUnaryCall
  LookupInvoice(
    argument: _lnrpc_proxy_PaymentHash,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_Invoice__Output>
  ): grpc.ClientUnaryCall
  LookupInvoice(
    argument: _lnrpc_proxy_PaymentHash,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_Invoice__Output>
  ): grpc.ClientUnaryCall
  LookupInvoice(
    argument: _lnrpc_proxy_PaymentHash,
    callback: grpc.requestCallback<_lnrpc_proxy_Invoice__Output>
  ): grpc.ClientUnaryCall
  lookupInvoice(
    argument: _lnrpc_proxy_PaymentHash,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_Invoice__Output>
  ): grpc.ClientUnaryCall
  lookupInvoice(
    argument: _lnrpc_proxy_PaymentHash,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_Invoice__Output>
  ): grpc.ClientUnaryCall
  lookupInvoice(
    argument: _lnrpc_proxy_PaymentHash,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_Invoice__Output>
  ): grpc.ClientUnaryCall
  lookupInvoice(
    argument: _lnrpc_proxy_PaymentHash,
    callback: grpc.requestCallback<_lnrpc_proxy_Invoice__Output>
  ): grpc.ClientUnaryCall

  QueryRoutes(
    argument: _lnrpc_proxy_QueryRoutesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_QueryRoutesResponse__Output>
  ): grpc.ClientUnaryCall
  QueryRoutes(
    argument: _lnrpc_proxy_QueryRoutesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_QueryRoutesResponse__Output>
  ): grpc.ClientUnaryCall
  QueryRoutes(
    argument: _lnrpc_proxy_QueryRoutesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_QueryRoutesResponse__Output>
  ): grpc.ClientUnaryCall
  QueryRoutes(
    argument: _lnrpc_proxy_QueryRoutesRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_QueryRoutesResponse__Output>
  ): grpc.ClientUnaryCall
  queryRoutes(
    argument: _lnrpc_proxy_QueryRoutesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_QueryRoutesResponse__Output>
  ): grpc.ClientUnaryCall
  queryRoutes(
    argument: _lnrpc_proxy_QueryRoutesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_QueryRoutesResponse__Output>
  ): grpc.ClientUnaryCall
  queryRoutes(
    argument: _lnrpc_proxy_QueryRoutesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_QueryRoutesResponse__Output>
  ): grpc.ClientUnaryCall
  queryRoutes(
    argument: _lnrpc_proxy_QueryRoutesRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_QueryRoutesResponse__Output>
  ): grpc.ClientUnaryCall

  SendPaymentSync(
    argument: _lnrpc_proxy_SendRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_SendResponse__Output>
  ): grpc.ClientUnaryCall
  SendPaymentSync(
    argument: _lnrpc_proxy_SendRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_SendResponse__Output>
  ): grpc.ClientUnaryCall
  SendPaymentSync(
    argument: _lnrpc_proxy_SendRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_SendResponse__Output>
  ): grpc.ClientUnaryCall
  SendPaymentSync(
    argument: _lnrpc_proxy_SendRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_SendResponse__Output>
  ): grpc.ClientUnaryCall
  sendPaymentSync(
    argument: _lnrpc_proxy_SendRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_SendResponse__Output>
  ): grpc.ClientUnaryCall
  sendPaymentSync(
    argument: _lnrpc_proxy_SendRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_SendResponse__Output>
  ): grpc.ClientUnaryCall
  sendPaymentSync(
    argument: _lnrpc_proxy_SendRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_SendResponse__Output>
  ): grpc.ClientUnaryCall
  sendPaymentSync(
    argument: _lnrpc_proxy_SendRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_SendResponse__Output>
  ): grpc.ClientUnaryCall

  SignMessage(
    argument: _lnrpc_proxy_SignMessageRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_SignMessageResponse__Output>
  ): grpc.ClientUnaryCall
  SignMessage(
    argument: _lnrpc_proxy_SignMessageRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_SignMessageResponse__Output>
  ): grpc.ClientUnaryCall
  SignMessage(
    argument: _lnrpc_proxy_SignMessageRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_SignMessageResponse__Output>
  ): grpc.ClientUnaryCall
  SignMessage(
    argument: _lnrpc_proxy_SignMessageRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_SignMessageResponse__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _lnrpc_proxy_SignMessageRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_SignMessageResponse__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _lnrpc_proxy_SignMessageRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_SignMessageResponse__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _lnrpc_proxy_SignMessageRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_SignMessageResponse__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _lnrpc_proxy_SignMessageRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_SignMessageResponse__Output>
  ): grpc.ClientUnaryCall

  SubscribeInvoices(
    argument: _lnrpc_proxy_InvoiceSubscription,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_proxy_Invoice__Output>
  SubscribeInvoices(
    argument: _lnrpc_proxy_InvoiceSubscription,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_proxy_Invoice__Output>
  subscribeInvoices(
    argument: _lnrpc_proxy_InvoiceSubscription,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_proxy_Invoice__Output>
  subscribeInvoices(
    argument: _lnrpc_proxy_InvoiceSubscription,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_lnrpc_proxy_Invoice__Output>

  VerifyMessage(
    argument: _lnrpc_proxy_VerifyMessageRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_VerifyMessageResponse__Output>
  ): grpc.ClientUnaryCall
  VerifyMessage(
    argument: _lnrpc_proxy_VerifyMessageRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_VerifyMessageResponse__Output>
  ): grpc.ClientUnaryCall
  VerifyMessage(
    argument: _lnrpc_proxy_VerifyMessageRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_VerifyMessageResponse__Output>
  ): grpc.ClientUnaryCall
  VerifyMessage(
    argument: _lnrpc_proxy_VerifyMessageRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_VerifyMessageResponse__Output>
  ): grpc.ClientUnaryCall
  verifyMessage(
    argument: _lnrpc_proxy_VerifyMessageRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_VerifyMessageResponse__Output>
  ): grpc.ClientUnaryCall
  verifyMessage(
    argument: _lnrpc_proxy_VerifyMessageRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_lnrpc_proxy_VerifyMessageResponse__Output>
  ): grpc.ClientUnaryCall
  verifyMessage(
    argument: _lnrpc_proxy_VerifyMessageRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_lnrpc_proxy_VerifyMessageResponse__Output>
  ): grpc.ClientUnaryCall
  verifyMessage(
    argument: _lnrpc_proxy_VerifyMessageRequest,
    callback: grpc.requestCallback<_lnrpc_proxy_VerifyMessageResponse__Output>
  ): grpc.ClientUnaryCall
}

export interface LightningHandlers extends grpc.UntypedServiceImplementation {
  AddInvoice: grpc.handleUnaryCall<
    _lnrpc_proxy_Invoice__Output,
    _lnrpc_proxy_AddInvoiceResponse
  >

  ChannelBalance: grpc.handleUnaryCall<
    _lnrpc_proxy_ChannelBalanceRequest__Output,
    _lnrpc_proxy_ChannelBalanceResponse
  >

  GetChanInfo: grpc.handleUnaryCall<
    _lnrpc_proxy_ChanInfoRequest__Output,
    _lnrpc_proxy_ChannelEdge
  >

  GetInfo: grpc.handleUnaryCall<
    _lnrpc_proxy_GetInfoRequest__Output,
    _lnrpc_proxy_GetInfoResponse
  >

  ListChannels: grpc.handleUnaryCall<
    _lnrpc_proxy_ListChannelsRequest__Output,
    _lnrpc_proxy_ListChannelsResponse
  >

  LookupInvoice: grpc.handleUnaryCall<
    _lnrpc_proxy_PaymentHash__Output,
    _lnrpc_proxy_Invoice
  >

  QueryRoutes: grpc.handleUnaryCall<
    _lnrpc_proxy_QueryRoutesRequest__Output,
    _lnrpc_proxy_QueryRoutesResponse
  >

  SendPaymentSync: grpc.handleUnaryCall<
    _lnrpc_proxy_SendRequest__Output,
    _lnrpc_proxy_SendResponse
  >

  SignMessage: grpc.handleUnaryCall<
    _lnrpc_proxy_SignMessageRequest__Output,
    _lnrpc_proxy_SignMessageResponse
  >

  SubscribeInvoices: grpc.handleServerStreamingCall<
    _lnrpc_proxy_InvoiceSubscription__Output,
    _lnrpc_proxy_Invoice
  >

  VerifyMessage: grpc.handleUnaryCall<
    _lnrpc_proxy_VerifyMessageRequest__Output,
    _lnrpc_proxy_VerifyMessageResponse
  >
}

export interface LightningDefinition extends grpc.ServiceDefinition {
  AddInvoice: MethodDefinition<
    _lnrpc_proxy_Invoice,
    _lnrpc_proxy_AddInvoiceResponse,
    _lnrpc_proxy_Invoice__Output,
    _lnrpc_proxy_AddInvoiceResponse__Output
  >
  ChannelBalance: MethodDefinition<
    _lnrpc_proxy_ChannelBalanceRequest,
    _lnrpc_proxy_ChannelBalanceResponse,
    _lnrpc_proxy_ChannelBalanceRequest__Output,
    _lnrpc_proxy_ChannelBalanceResponse__Output
  >
  GetChanInfo: MethodDefinition<
    _lnrpc_proxy_ChanInfoRequest,
    _lnrpc_proxy_ChannelEdge,
    _lnrpc_proxy_ChanInfoRequest__Output,
    _lnrpc_proxy_ChannelEdge__Output
  >
  GetInfo: MethodDefinition<
    _lnrpc_proxy_GetInfoRequest,
    _lnrpc_proxy_GetInfoResponse,
    _lnrpc_proxy_GetInfoRequest__Output,
    _lnrpc_proxy_GetInfoResponse__Output
  >
  ListChannels: MethodDefinition<
    _lnrpc_proxy_ListChannelsRequest,
    _lnrpc_proxy_ListChannelsResponse,
    _lnrpc_proxy_ListChannelsRequest__Output,
    _lnrpc_proxy_ListChannelsResponse__Output
  >
  LookupInvoice: MethodDefinition<
    _lnrpc_proxy_PaymentHash,
    _lnrpc_proxy_Invoice,
    _lnrpc_proxy_PaymentHash__Output,
    _lnrpc_proxy_Invoice__Output
  >
  QueryRoutes: MethodDefinition<
    _lnrpc_proxy_QueryRoutesRequest,
    _lnrpc_proxy_QueryRoutesResponse,
    _lnrpc_proxy_QueryRoutesRequest__Output,
    _lnrpc_proxy_QueryRoutesResponse__Output
  >
  SendPaymentSync: MethodDefinition<
    _lnrpc_proxy_SendRequest,
    _lnrpc_proxy_SendResponse,
    _lnrpc_proxy_SendRequest__Output,
    _lnrpc_proxy_SendResponse__Output
  >
  SignMessage: MethodDefinition<
    _lnrpc_proxy_SignMessageRequest,
    _lnrpc_proxy_SignMessageResponse,
    _lnrpc_proxy_SignMessageRequest__Output,
    _lnrpc_proxy_SignMessageResponse__Output
  >
  SubscribeInvoices: MethodDefinition<
    _lnrpc_proxy_InvoiceSubscription,
    _lnrpc_proxy_Invoice,
    _lnrpc_proxy_InvoiceSubscription__Output,
    _lnrpc_proxy_Invoice__Output
  >
  VerifyMessage: MethodDefinition<
    _lnrpc_proxy_VerifyMessageRequest,
    _lnrpc_proxy_VerifyMessageResponse,
    _lnrpc_proxy_VerifyMessageRequest__Output,
    _lnrpc_proxy_VerifyMessageResponse__Output
  >
}
