// Original file: proto/greenlight.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type {
  CloseChannelRequest as _greenlight_CloseChannelRequest,
  CloseChannelRequest__Output as _greenlight_CloseChannelRequest__Output,
} from '../greenlight/CloseChannelRequest'
import type {
  CloseChannelResponse as _greenlight_CloseChannelResponse,
  CloseChannelResponse__Output as _greenlight_CloseChannelResponse__Output,
} from '../greenlight/CloseChannelResponse'
import type {
  ConnectRequest as _greenlight_ConnectRequest,
  ConnectRequest__Output as _greenlight_ConnectRequest__Output,
} from '../greenlight/ConnectRequest'
import type {
  ConnectResponse as _greenlight_ConnectResponse,
  ConnectResponse__Output as _greenlight_ConnectResponse__Output,
} from '../greenlight/ConnectResponse'
import type {
  DisconnectRequest as _greenlight_DisconnectRequest,
  DisconnectRequest__Output as _greenlight_DisconnectRequest__Output,
} from '../greenlight/DisconnectRequest'
import type {
  DisconnectResponse as _greenlight_DisconnectResponse,
  DisconnectResponse__Output as _greenlight_DisconnectResponse__Output,
} from '../greenlight/DisconnectResponse'
import type {
  Empty as _greenlight_Empty,
  Empty__Output as _greenlight_Empty__Output,
} from '../greenlight/Empty'
import type {
  FundChannelRequest as _greenlight_FundChannelRequest,
  FundChannelRequest__Output as _greenlight_FundChannelRequest__Output,
} from '../greenlight/FundChannelRequest'
import type {
  FundChannelResponse as _greenlight_FundChannelResponse,
  FundChannelResponse__Output as _greenlight_FundChannelResponse__Output,
} from '../greenlight/FundChannelResponse'
import type {
  GetInfoRequest as _greenlight_GetInfoRequest,
  GetInfoRequest__Output as _greenlight_GetInfoRequest__Output,
} from '../greenlight/GetInfoRequest'
import type {
  GetInfoResponse as _greenlight_GetInfoResponse,
  GetInfoResponse__Output as _greenlight_GetInfoResponse__Output,
} from '../greenlight/GetInfoResponse'
import type {
  HsmRequest as _greenlight_HsmRequest,
  HsmRequest__Output as _greenlight_HsmRequest__Output,
} from '../greenlight/HsmRequest'
import type {
  HsmResponse as _greenlight_HsmResponse,
  HsmResponse__Output as _greenlight_HsmResponse__Output,
} from '../greenlight/HsmResponse'
import type {
  IncomingPayment as _greenlight_IncomingPayment,
  IncomingPayment__Output as _greenlight_IncomingPayment__Output,
} from '../greenlight/IncomingPayment'
import type {
  Invoice as _greenlight_Invoice,
  Invoice__Output as _greenlight_Invoice__Output,
} from '../greenlight/Invoice'
import type {
  InvoiceRequest as _greenlight_InvoiceRequest,
  InvoiceRequest__Output as _greenlight_InvoiceRequest__Output,
} from '../greenlight/InvoiceRequest'
import type {
  KeysendRequest as _greenlight_KeysendRequest,
  KeysendRequest__Output as _greenlight_KeysendRequest__Output,
} from '../greenlight/KeysendRequest'
import type {
  ListFundsRequest as _greenlight_ListFundsRequest,
  ListFundsRequest__Output as _greenlight_ListFundsRequest__Output,
} from '../greenlight/ListFundsRequest'
import type {
  ListFundsResponse as _greenlight_ListFundsResponse,
  ListFundsResponse__Output as _greenlight_ListFundsResponse__Output,
} from '../greenlight/ListFundsResponse'
import type {
  ListInvoicesRequest as _greenlight_ListInvoicesRequest,
  ListInvoicesRequest__Output as _greenlight_ListInvoicesRequest__Output,
} from '../greenlight/ListInvoicesRequest'
import type {
  ListInvoicesResponse as _greenlight_ListInvoicesResponse,
  ListInvoicesResponse__Output as _greenlight_ListInvoicesResponse__Output,
} from '../greenlight/ListInvoicesResponse'
import type {
  ListPaymentsRequest as _greenlight_ListPaymentsRequest,
  ListPaymentsRequest__Output as _greenlight_ListPaymentsRequest__Output,
} from '../greenlight/ListPaymentsRequest'
import type {
  ListPaymentsResponse as _greenlight_ListPaymentsResponse,
  ListPaymentsResponse__Output as _greenlight_ListPaymentsResponse__Output,
} from '../greenlight/ListPaymentsResponse'
import type {
  ListPeersRequest as _greenlight_ListPeersRequest,
  ListPeersRequest__Output as _greenlight_ListPeersRequest__Output,
} from '../greenlight/ListPeersRequest'
import type {
  ListPeersResponse as _greenlight_ListPeersResponse,
  ListPeersResponse__Output as _greenlight_ListPeersResponse__Output,
} from '../greenlight/ListPeersResponse'
import type {
  NewAddrRequest as _greenlight_NewAddrRequest,
  NewAddrRequest__Output as _greenlight_NewAddrRequest__Output,
} from '../greenlight/NewAddrRequest'
import type {
  NewAddrResponse as _greenlight_NewAddrResponse,
  NewAddrResponse__Output as _greenlight_NewAddrResponse__Output,
} from '../greenlight/NewAddrResponse'
import type {
  PayRequest as _greenlight_PayRequest,
  PayRequest__Output as _greenlight_PayRequest__Output,
} from '../greenlight/PayRequest'
import type {
  Payment as _greenlight_Payment,
  Payment__Output as _greenlight_Payment__Output,
} from '../greenlight/Payment'
import type {
  StopRequest as _greenlight_StopRequest,
  StopRequest__Output as _greenlight_StopRequest__Output,
} from '../greenlight/StopRequest'
import type {
  StopResponse as _greenlight_StopResponse,
  StopResponse__Output as _greenlight_StopResponse__Output,
} from '../greenlight/StopResponse'
import type {
  StreamIncomingFilter as _greenlight_StreamIncomingFilter,
  StreamIncomingFilter__Output as _greenlight_StreamIncomingFilter__Output,
} from '../greenlight/StreamIncomingFilter'
import type {
  WithdrawRequest as _greenlight_WithdrawRequest,
  WithdrawRequest__Output as _greenlight_WithdrawRequest__Output,
} from '../greenlight/WithdrawRequest'
import type {
  WithdrawResponse as _greenlight_WithdrawResponse,
  WithdrawResponse__Output as _greenlight_WithdrawResponse__Output,
} from '../greenlight/WithdrawResponse'

export interface NodeClient extends grpc.Client {
  CloseChannel(
    argument: _greenlight_CloseChannelRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_CloseChannelResponse__Output>
  ): grpc.ClientUnaryCall
  CloseChannel(
    argument: _greenlight_CloseChannelRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_CloseChannelResponse__Output>
  ): grpc.ClientUnaryCall
  CloseChannel(
    argument: _greenlight_CloseChannelRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_CloseChannelResponse__Output>
  ): grpc.ClientUnaryCall
  CloseChannel(
    argument: _greenlight_CloseChannelRequest,
    callback: grpc.requestCallback<_greenlight_CloseChannelResponse__Output>
  ): grpc.ClientUnaryCall
  closeChannel(
    argument: _greenlight_CloseChannelRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_CloseChannelResponse__Output>
  ): grpc.ClientUnaryCall
  closeChannel(
    argument: _greenlight_CloseChannelRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_CloseChannelResponse__Output>
  ): grpc.ClientUnaryCall
  closeChannel(
    argument: _greenlight_CloseChannelRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_CloseChannelResponse__Output>
  ): grpc.ClientUnaryCall
  closeChannel(
    argument: _greenlight_CloseChannelRequest,
    callback: grpc.requestCallback<_greenlight_CloseChannelResponse__Output>
  ): grpc.ClientUnaryCall

  ConnectPeer(
    argument: _greenlight_ConnectRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  ConnectPeer(
    argument: _greenlight_ConnectRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  ConnectPeer(
    argument: _greenlight_ConnectRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  ConnectPeer(
    argument: _greenlight_ConnectRequest,
    callback: grpc.requestCallback<_greenlight_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  connectPeer(
    argument: _greenlight_ConnectRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  connectPeer(
    argument: _greenlight_ConnectRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  connectPeer(
    argument: _greenlight_ConnectRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  connectPeer(
    argument: _greenlight_ConnectRequest,
    callback: grpc.requestCallback<_greenlight_ConnectResponse__Output>
  ): grpc.ClientUnaryCall

  CreateInvoice(
    argument: _greenlight_InvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Invoice__Output>
  ): grpc.ClientUnaryCall
  CreateInvoice(
    argument: _greenlight_InvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_Invoice__Output>
  ): grpc.ClientUnaryCall
  CreateInvoice(
    argument: _greenlight_InvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Invoice__Output>
  ): grpc.ClientUnaryCall
  CreateInvoice(
    argument: _greenlight_InvoiceRequest,
    callback: grpc.requestCallback<_greenlight_Invoice__Output>
  ): grpc.ClientUnaryCall
  createInvoice(
    argument: _greenlight_InvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Invoice__Output>
  ): grpc.ClientUnaryCall
  createInvoice(
    argument: _greenlight_InvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_Invoice__Output>
  ): grpc.ClientUnaryCall
  createInvoice(
    argument: _greenlight_InvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Invoice__Output>
  ): grpc.ClientUnaryCall
  createInvoice(
    argument: _greenlight_InvoiceRequest,
    callback: grpc.requestCallback<_greenlight_Invoice__Output>
  ): grpc.ClientUnaryCall

  Disconnect(
    argument: _greenlight_DisconnectRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  Disconnect(
    argument: _greenlight_DisconnectRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  Disconnect(
    argument: _greenlight_DisconnectRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  Disconnect(
    argument: _greenlight_DisconnectRequest,
    callback: grpc.requestCallback<_greenlight_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  disconnect(
    argument: _greenlight_DisconnectRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  disconnect(
    argument: _greenlight_DisconnectRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  disconnect(
    argument: _greenlight_DisconnectRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  disconnect(
    argument: _greenlight_DisconnectRequest,
    callback: grpc.requestCallback<_greenlight_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall

  FundChannel(
    argument: _greenlight_FundChannelRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_FundChannelResponse__Output>
  ): grpc.ClientUnaryCall
  FundChannel(
    argument: _greenlight_FundChannelRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_FundChannelResponse__Output>
  ): grpc.ClientUnaryCall
  FundChannel(
    argument: _greenlight_FundChannelRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_FundChannelResponse__Output>
  ): grpc.ClientUnaryCall
  FundChannel(
    argument: _greenlight_FundChannelRequest,
    callback: grpc.requestCallback<_greenlight_FundChannelResponse__Output>
  ): grpc.ClientUnaryCall
  fundChannel(
    argument: _greenlight_FundChannelRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_FundChannelResponse__Output>
  ): grpc.ClientUnaryCall
  fundChannel(
    argument: _greenlight_FundChannelRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_FundChannelResponse__Output>
  ): grpc.ClientUnaryCall
  fundChannel(
    argument: _greenlight_FundChannelRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_FundChannelResponse__Output>
  ): grpc.ClientUnaryCall
  fundChannel(
    argument: _greenlight_FundChannelRequest,
    callback: grpc.requestCallback<_greenlight_FundChannelResponse__Output>
  ): grpc.ClientUnaryCall

  GetInfo(
    argument: _greenlight_GetInfoRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  GetInfo(
    argument: _greenlight_GetInfoRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  GetInfo(
    argument: _greenlight_GetInfoRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  GetInfo(
    argument: _greenlight_GetInfoRequest,
    callback: grpc.requestCallback<_greenlight_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  getInfo(
    argument: _greenlight_GetInfoRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  getInfo(
    argument: _greenlight_GetInfoRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  getInfo(
    argument: _greenlight_GetInfoRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall
  getInfo(
    argument: _greenlight_GetInfoRequest,
    callback: grpc.requestCallback<_greenlight_GetInfoResponse__Output>
  ): grpc.ClientUnaryCall

  Keysend(
    argument: _greenlight_KeysendRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  Keysend(
    argument: _greenlight_KeysendRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  Keysend(
    argument: _greenlight_KeysendRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  Keysend(
    argument: _greenlight_KeysendRequest,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  keysend(
    argument: _greenlight_KeysendRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  keysend(
    argument: _greenlight_KeysendRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  keysend(
    argument: _greenlight_KeysendRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  keysend(
    argument: _greenlight_KeysendRequest,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall

  ListFunds(
    argument: _greenlight_ListFundsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListFundsResponse__Output>
  ): grpc.ClientUnaryCall
  ListFunds(
    argument: _greenlight_ListFundsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_ListFundsResponse__Output>
  ): grpc.ClientUnaryCall
  ListFunds(
    argument: _greenlight_ListFundsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListFundsResponse__Output>
  ): grpc.ClientUnaryCall
  ListFunds(
    argument: _greenlight_ListFundsRequest,
    callback: grpc.requestCallback<_greenlight_ListFundsResponse__Output>
  ): grpc.ClientUnaryCall
  listFunds(
    argument: _greenlight_ListFundsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListFundsResponse__Output>
  ): grpc.ClientUnaryCall
  listFunds(
    argument: _greenlight_ListFundsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_ListFundsResponse__Output>
  ): grpc.ClientUnaryCall
  listFunds(
    argument: _greenlight_ListFundsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListFundsResponse__Output>
  ): grpc.ClientUnaryCall
  listFunds(
    argument: _greenlight_ListFundsRequest,
    callback: grpc.requestCallback<_greenlight_ListFundsResponse__Output>
  ): grpc.ClientUnaryCall

  ListInvoices(
    argument: _greenlight_ListInvoicesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListInvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  ListInvoices(
    argument: _greenlight_ListInvoicesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_ListInvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  ListInvoices(
    argument: _greenlight_ListInvoicesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListInvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  ListInvoices(
    argument: _greenlight_ListInvoicesRequest,
    callback: grpc.requestCallback<_greenlight_ListInvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  listInvoices(
    argument: _greenlight_ListInvoicesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListInvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  listInvoices(
    argument: _greenlight_ListInvoicesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_ListInvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  listInvoices(
    argument: _greenlight_ListInvoicesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListInvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  listInvoices(
    argument: _greenlight_ListInvoicesRequest,
    callback: grpc.requestCallback<_greenlight_ListInvoicesResponse__Output>
  ): grpc.ClientUnaryCall

  ListPayments(
    argument: _greenlight_ListPaymentsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListPaymentsResponse__Output>
  ): grpc.ClientUnaryCall
  ListPayments(
    argument: _greenlight_ListPaymentsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_ListPaymentsResponse__Output>
  ): grpc.ClientUnaryCall
  ListPayments(
    argument: _greenlight_ListPaymentsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListPaymentsResponse__Output>
  ): grpc.ClientUnaryCall
  ListPayments(
    argument: _greenlight_ListPaymentsRequest,
    callback: grpc.requestCallback<_greenlight_ListPaymentsResponse__Output>
  ): grpc.ClientUnaryCall
  listPayments(
    argument: _greenlight_ListPaymentsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListPaymentsResponse__Output>
  ): grpc.ClientUnaryCall
  listPayments(
    argument: _greenlight_ListPaymentsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_ListPaymentsResponse__Output>
  ): grpc.ClientUnaryCall
  listPayments(
    argument: _greenlight_ListPaymentsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListPaymentsResponse__Output>
  ): grpc.ClientUnaryCall
  listPayments(
    argument: _greenlight_ListPaymentsRequest,
    callback: grpc.requestCallback<_greenlight_ListPaymentsResponse__Output>
  ): grpc.ClientUnaryCall

  ListPeers(
    argument: _greenlight_ListPeersRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListPeersResponse__Output>
  ): grpc.ClientUnaryCall
  ListPeers(
    argument: _greenlight_ListPeersRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_ListPeersResponse__Output>
  ): grpc.ClientUnaryCall
  ListPeers(
    argument: _greenlight_ListPeersRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListPeersResponse__Output>
  ): grpc.ClientUnaryCall
  ListPeers(
    argument: _greenlight_ListPeersRequest,
    callback: grpc.requestCallback<_greenlight_ListPeersResponse__Output>
  ): grpc.ClientUnaryCall
  listPeers(
    argument: _greenlight_ListPeersRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListPeersResponse__Output>
  ): grpc.ClientUnaryCall
  listPeers(
    argument: _greenlight_ListPeersRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_ListPeersResponse__Output>
  ): grpc.ClientUnaryCall
  listPeers(
    argument: _greenlight_ListPeersRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_ListPeersResponse__Output>
  ): grpc.ClientUnaryCall
  listPeers(
    argument: _greenlight_ListPeersRequest,
    callback: grpc.requestCallback<_greenlight_ListPeersResponse__Output>
  ): grpc.ClientUnaryCall

  NewAddr(
    argument: _greenlight_NewAddrRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_NewAddrResponse__Output>
  ): grpc.ClientUnaryCall
  NewAddr(
    argument: _greenlight_NewAddrRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_NewAddrResponse__Output>
  ): grpc.ClientUnaryCall
  NewAddr(
    argument: _greenlight_NewAddrRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_NewAddrResponse__Output>
  ): grpc.ClientUnaryCall
  NewAddr(
    argument: _greenlight_NewAddrRequest,
    callback: grpc.requestCallback<_greenlight_NewAddrResponse__Output>
  ): grpc.ClientUnaryCall
  newAddr(
    argument: _greenlight_NewAddrRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_NewAddrResponse__Output>
  ): grpc.ClientUnaryCall
  newAddr(
    argument: _greenlight_NewAddrRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_NewAddrResponse__Output>
  ): grpc.ClientUnaryCall
  newAddr(
    argument: _greenlight_NewAddrRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_NewAddrResponse__Output>
  ): grpc.ClientUnaryCall
  newAddr(
    argument: _greenlight_NewAddrRequest,
    callback: grpc.requestCallback<_greenlight_NewAddrResponse__Output>
  ): grpc.ClientUnaryCall

  Pay(
    argument: _greenlight_PayRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  Pay(
    argument: _greenlight_PayRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  Pay(
    argument: _greenlight_PayRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  Pay(
    argument: _greenlight_PayRequest,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  pay(
    argument: _greenlight_PayRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  pay(
    argument: _greenlight_PayRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  pay(
    argument: _greenlight_PayRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall
  pay(
    argument: _greenlight_PayRequest,
    callback: grpc.requestCallback<_greenlight_Payment__Output>
  ): grpc.ClientUnaryCall

  RespondHsmRequest(
    argument: _greenlight_HsmResponse,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Empty__Output>
  ): grpc.ClientUnaryCall
  RespondHsmRequest(
    argument: _greenlight_HsmResponse,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_Empty__Output>
  ): grpc.ClientUnaryCall
  RespondHsmRequest(
    argument: _greenlight_HsmResponse,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Empty__Output>
  ): grpc.ClientUnaryCall
  RespondHsmRequest(
    argument: _greenlight_HsmResponse,
    callback: grpc.requestCallback<_greenlight_Empty__Output>
  ): grpc.ClientUnaryCall
  respondHsmRequest(
    argument: _greenlight_HsmResponse,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Empty__Output>
  ): grpc.ClientUnaryCall
  respondHsmRequest(
    argument: _greenlight_HsmResponse,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_Empty__Output>
  ): grpc.ClientUnaryCall
  respondHsmRequest(
    argument: _greenlight_HsmResponse,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_Empty__Output>
  ): grpc.ClientUnaryCall
  respondHsmRequest(
    argument: _greenlight_HsmResponse,
    callback: grpc.requestCallback<_greenlight_Empty__Output>
  ): grpc.ClientUnaryCall

  Stop(
    argument: _greenlight_StopRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_StopResponse__Output>
  ): grpc.ClientUnaryCall
  Stop(
    argument: _greenlight_StopRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_StopResponse__Output>
  ): grpc.ClientUnaryCall
  Stop(
    argument: _greenlight_StopRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_StopResponse__Output>
  ): grpc.ClientUnaryCall
  Stop(
    argument: _greenlight_StopRequest,
    callback: grpc.requestCallback<_greenlight_StopResponse__Output>
  ): grpc.ClientUnaryCall
  stop(
    argument: _greenlight_StopRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_StopResponse__Output>
  ): grpc.ClientUnaryCall
  stop(
    argument: _greenlight_StopRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_StopResponse__Output>
  ): grpc.ClientUnaryCall
  stop(
    argument: _greenlight_StopRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_StopResponse__Output>
  ): grpc.ClientUnaryCall
  stop(
    argument: _greenlight_StopRequest,
    callback: grpc.requestCallback<_greenlight_StopResponse__Output>
  ): grpc.ClientUnaryCall

  StreamHsmRequests(
    argument: _greenlight_Empty,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_greenlight_HsmRequest__Output>
  StreamHsmRequests(
    argument: _greenlight_Empty,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_greenlight_HsmRequest__Output>
  streamHsmRequests(
    argument: _greenlight_Empty,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_greenlight_HsmRequest__Output>
  streamHsmRequests(
    argument: _greenlight_Empty,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_greenlight_HsmRequest__Output>

  StreamIncoming(
    argument: _greenlight_StreamIncomingFilter,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_greenlight_IncomingPayment__Output>
  StreamIncoming(
    argument: _greenlight_StreamIncomingFilter,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_greenlight_IncomingPayment__Output>
  streamIncoming(
    argument: _greenlight_StreamIncomingFilter,
    metadata: grpc.Metadata,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_greenlight_IncomingPayment__Output>
  streamIncoming(
    argument: _greenlight_StreamIncomingFilter,
    options?: grpc.CallOptions
  ): grpc.ClientReadableStream<_greenlight_IncomingPayment__Output>

  Withdraw(
    argument: _greenlight_WithdrawRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  Withdraw(
    argument: _greenlight_WithdrawRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  Withdraw(
    argument: _greenlight_WithdrawRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  Withdraw(
    argument: _greenlight_WithdrawRequest,
    callback: grpc.requestCallback<_greenlight_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  withdraw(
    argument: _greenlight_WithdrawRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  withdraw(
    argument: _greenlight_WithdrawRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_greenlight_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  withdraw(
    argument: _greenlight_WithdrawRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_greenlight_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  withdraw(
    argument: _greenlight_WithdrawRequest,
    callback: grpc.requestCallback<_greenlight_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
}

export interface NodeHandlers extends grpc.UntypedServiceImplementation {
  CloseChannel: grpc.handleUnaryCall<
    _greenlight_CloseChannelRequest__Output,
    _greenlight_CloseChannelResponse
  >

  ConnectPeer: grpc.handleUnaryCall<
    _greenlight_ConnectRequest__Output,
    _greenlight_ConnectResponse
  >

  CreateInvoice: grpc.handleUnaryCall<
    _greenlight_InvoiceRequest__Output,
    _greenlight_Invoice
  >

  Disconnect: grpc.handleUnaryCall<
    _greenlight_DisconnectRequest__Output,
    _greenlight_DisconnectResponse
  >

  FundChannel: grpc.handleUnaryCall<
    _greenlight_FundChannelRequest__Output,
    _greenlight_FundChannelResponse
  >

  GetInfo: grpc.handleUnaryCall<
    _greenlight_GetInfoRequest__Output,
    _greenlight_GetInfoResponse
  >

  Keysend: grpc.handleUnaryCall<
    _greenlight_KeysendRequest__Output,
    _greenlight_Payment
  >

  ListFunds: grpc.handleUnaryCall<
    _greenlight_ListFundsRequest__Output,
    _greenlight_ListFundsResponse
  >

  ListInvoices: grpc.handleUnaryCall<
    _greenlight_ListInvoicesRequest__Output,
    _greenlight_ListInvoicesResponse
  >

  ListPayments: grpc.handleUnaryCall<
    _greenlight_ListPaymentsRequest__Output,
    _greenlight_ListPaymentsResponse
  >

  ListPeers: grpc.handleUnaryCall<
    _greenlight_ListPeersRequest__Output,
    _greenlight_ListPeersResponse
  >

  NewAddr: grpc.handleUnaryCall<
    _greenlight_NewAddrRequest__Output,
    _greenlight_NewAddrResponse
  >

  Pay: grpc.handleUnaryCall<_greenlight_PayRequest__Output, _greenlight_Payment>

  RespondHsmRequest: grpc.handleUnaryCall<
    _greenlight_HsmResponse__Output,
    _greenlight_Empty
  >

  Stop: grpc.handleUnaryCall<
    _greenlight_StopRequest__Output,
    _greenlight_StopResponse
  >

  StreamHsmRequests: grpc.handleServerStreamingCall<
    _greenlight_Empty__Output,
    _greenlight_HsmRequest
  >

  StreamIncoming: grpc.handleServerStreamingCall<
    _greenlight_StreamIncomingFilter__Output,
    _greenlight_IncomingPayment
  >

  Withdraw: grpc.handleUnaryCall<
    _greenlight_WithdrawRequest__Output,
    _greenlight_WithdrawResponse
  >
}

export interface NodeDefinition extends grpc.ServiceDefinition {
  CloseChannel: MethodDefinition<
    _greenlight_CloseChannelRequest,
    _greenlight_CloseChannelResponse,
    _greenlight_CloseChannelRequest__Output,
    _greenlight_CloseChannelResponse__Output
  >
  ConnectPeer: MethodDefinition<
    _greenlight_ConnectRequest,
    _greenlight_ConnectResponse,
    _greenlight_ConnectRequest__Output,
    _greenlight_ConnectResponse__Output
  >
  CreateInvoice: MethodDefinition<
    _greenlight_InvoiceRequest,
    _greenlight_Invoice,
    _greenlight_InvoiceRequest__Output,
    _greenlight_Invoice__Output
  >
  Disconnect: MethodDefinition<
    _greenlight_DisconnectRequest,
    _greenlight_DisconnectResponse,
    _greenlight_DisconnectRequest__Output,
    _greenlight_DisconnectResponse__Output
  >
  FundChannel: MethodDefinition<
    _greenlight_FundChannelRequest,
    _greenlight_FundChannelResponse,
    _greenlight_FundChannelRequest__Output,
    _greenlight_FundChannelResponse__Output
  >
  GetInfo: MethodDefinition<
    _greenlight_GetInfoRequest,
    _greenlight_GetInfoResponse,
    _greenlight_GetInfoRequest__Output,
    _greenlight_GetInfoResponse__Output
  >
  Keysend: MethodDefinition<
    _greenlight_KeysendRequest,
    _greenlight_Payment,
    _greenlight_KeysendRequest__Output,
    _greenlight_Payment__Output
  >
  ListFunds: MethodDefinition<
    _greenlight_ListFundsRequest,
    _greenlight_ListFundsResponse,
    _greenlight_ListFundsRequest__Output,
    _greenlight_ListFundsResponse__Output
  >
  ListInvoices: MethodDefinition<
    _greenlight_ListInvoicesRequest,
    _greenlight_ListInvoicesResponse,
    _greenlight_ListInvoicesRequest__Output,
    _greenlight_ListInvoicesResponse__Output
  >
  ListPayments: MethodDefinition<
    _greenlight_ListPaymentsRequest,
    _greenlight_ListPaymentsResponse,
    _greenlight_ListPaymentsRequest__Output,
    _greenlight_ListPaymentsResponse__Output
  >
  ListPeers: MethodDefinition<
    _greenlight_ListPeersRequest,
    _greenlight_ListPeersResponse,
    _greenlight_ListPeersRequest__Output,
    _greenlight_ListPeersResponse__Output
  >
  NewAddr: MethodDefinition<
    _greenlight_NewAddrRequest,
    _greenlight_NewAddrResponse,
    _greenlight_NewAddrRequest__Output,
    _greenlight_NewAddrResponse__Output
  >
  Pay: MethodDefinition<
    _greenlight_PayRequest,
    _greenlight_Payment,
    _greenlight_PayRequest__Output,
    _greenlight_Payment__Output
  >
  RespondHsmRequest: MethodDefinition<
    _greenlight_HsmResponse,
    _greenlight_Empty,
    _greenlight_HsmResponse__Output,
    _greenlight_Empty__Output
  >
  Stop: MethodDefinition<
    _greenlight_StopRequest,
    _greenlight_StopResponse,
    _greenlight_StopRequest__Output,
    _greenlight_StopResponse__Output
  >
  StreamHsmRequests: MethodDefinition<
    _greenlight_Empty,
    _greenlight_HsmRequest,
    _greenlight_Empty__Output,
    _greenlight_HsmRequest__Output
  >
  StreamIncoming: MethodDefinition<
    _greenlight_StreamIncomingFilter,
    _greenlight_IncomingPayment,
    _greenlight_StreamIncomingFilter__Output,
    _greenlight_IncomingPayment__Output
  >
  Withdraw: MethodDefinition<
    _greenlight_WithdrawRequest,
    _greenlight_WithdrawResponse,
    _greenlight_WithdrawRequest__Output,
    _greenlight_WithdrawResponse__Output
  >
}
