// Original file: proto/cln/node.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type {
  AddgossipRequest as _cln_AddgossipRequest,
  AddgossipRequest__Output as _cln_AddgossipRequest__Output,
} from '../cln/AddgossipRequest'
import type {
  AddgossipResponse as _cln_AddgossipResponse,
  AddgossipResponse__Output as _cln_AddgossipResponse__Output,
} from '../cln/AddgossipResponse'
import type {
  AutocleaninvoiceRequest as _cln_AutocleaninvoiceRequest,
  AutocleaninvoiceRequest__Output as _cln_AutocleaninvoiceRequest__Output,
} from '../cln/AutocleaninvoiceRequest'
import type {
  AutocleaninvoiceResponse as _cln_AutocleaninvoiceResponse,
  AutocleaninvoiceResponse__Output as _cln_AutocleaninvoiceResponse__Output,
} from '../cln/AutocleaninvoiceResponse'
import type {
  CheckmessageRequest as _cln_CheckmessageRequest,
  CheckmessageRequest__Output as _cln_CheckmessageRequest__Output,
} from '../cln/CheckmessageRequest'
import type {
  CheckmessageResponse as _cln_CheckmessageResponse,
  CheckmessageResponse__Output as _cln_CheckmessageResponse__Output,
} from '../cln/CheckmessageResponse'
import type {
  CloseRequest as _cln_CloseRequest,
  CloseRequest__Output as _cln_CloseRequest__Output,
} from '../cln/CloseRequest'
import type {
  CloseResponse as _cln_CloseResponse,
  CloseResponse__Output as _cln_CloseResponse__Output,
} from '../cln/CloseResponse'
import type {
  ConnectRequest as _cln_ConnectRequest,
  ConnectRequest__Output as _cln_ConnectRequest__Output,
} from '../cln/ConnectRequest'
import type {
  ConnectResponse as _cln_ConnectResponse,
  ConnectResponse__Output as _cln_ConnectResponse__Output,
} from '../cln/ConnectResponse'
import type {
  CreateinvoiceRequest as _cln_CreateinvoiceRequest,
  CreateinvoiceRequest__Output as _cln_CreateinvoiceRequest__Output,
} from '../cln/CreateinvoiceRequest'
import type {
  CreateinvoiceResponse as _cln_CreateinvoiceResponse,
  CreateinvoiceResponse__Output as _cln_CreateinvoiceResponse__Output,
} from '../cln/CreateinvoiceResponse'
import type {
  CreateonionRequest as _cln_CreateonionRequest,
  CreateonionRequest__Output as _cln_CreateonionRequest__Output,
} from '../cln/CreateonionRequest'
import type {
  CreateonionResponse as _cln_CreateonionResponse,
  CreateonionResponse__Output as _cln_CreateonionResponse__Output,
} from '../cln/CreateonionResponse'
import type {
  DatastoreRequest as _cln_DatastoreRequest,
  DatastoreRequest__Output as _cln_DatastoreRequest__Output,
} from '../cln/DatastoreRequest'
import type {
  DatastoreResponse as _cln_DatastoreResponse,
  DatastoreResponse__Output as _cln_DatastoreResponse__Output,
} from '../cln/DatastoreResponse'
import type {
  DeldatastoreRequest as _cln_DeldatastoreRequest,
  DeldatastoreRequest__Output as _cln_DeldatastoreRequest__Output,
} from '../cln/DeldatastoreRequest'
import type {
  DeldatastoreResponse as _cln_DeldatastoreResponse,
  DeldatastoreResponse__Output as _cln_DeldatastoreResponse__Output,
} from '../cln/DeldatastoreResponse'
import type {
  DelexpiredinvoiceRequest as _cln_DelexpiredinvoiceRequest,
  DelexpiredinvoiceRequest__Output as _cln_DelexpiredinvoiceRequest__Output,
} from '../cln/DelexpiredinvoiceRequest'
import type {
  DelexpiredinvoiceResponse as _cln_DelexpiredinvoiceResponse,
  DelexpiredinvoiceResponse__Output as _cln_DelexpiredinvoiceResponse__Output,
} from '../cln/DelexpiredinvoiceResponse'
import type {
  DelinvoiceRequest as _cln_DelinvoiceRequest,
  DelinvoiceRequest__Output as _cln_DelinvoiceRequest__Output,
} from '../cln/DelinvoiceRequest'
import type {
  DelinvoiceResponse as _cln_DelinvoiceResponse,
  DelinvoiceResponse__Output as _cln_DelinvoiceResponse__Output,
} from '../cln/DelinvoiceResponse'
import type {
  DisconnectRequest as _cln_DisconnectRequest,
  DisconnectRequest__Output as _cln_DisconnectRequest__Output,
} from '../cln/DisconnectRequest'
import type {
  DisconnectResponse as _cln_DisconnectResponse,
  DisconnectResponse__Output as _cln_DisconnectResponse__Output,
} from '../cln/DisconnectResponse'
import type {
  FeeratesRequest as _cln_FeeratesRequest,
  FeeratesRequest__Output as _cln_FeeratesRequest__Output,
} from '../cln/FeeratesRequest'
import type {
  FeeratesResponse as _cln_FeeratesResponse,
  FeeratesResponse__Output as _cln_FeeratesResponse__Output,
} from '../cln/FeeratesResponse'
import type {
  FundchannelRequest as _cln_FundchannelRequest,
  FundchannelRequest__Output as _cln_FundchannelRequest__Output,
} from '../cln/FundchannelRequest'
import type {
  FundchannelResponse as _cln_FundchannelResponse,
  FundchannelResponse__Output as _cln_FundchannelResponse__Output,
} from '../cln/FundchannelResponse'
import type {
  FundpsbtRequest as _cln_FundpsbtRequest,
  FundpsbtRequest__Output as _cln_FundpsbtRequest__Output,
} from '../cln/FundpsbtRequest'
import type {
  FundpsbtResponse as _cln_FundpsbtResponse,
  FundpsbtResponse__Output as _cln_FundpsbtResponse__Output,
} from '../cln/FundpsbtResponse'
import type {
  GetinfoRequest as _cln_GetinfoRequest,
  GetinfoRequest__Output as _cln_GetinfoRequest__Output,
} from '../cln/GetinfoRequest'
import type {
  GetinfoResponse as _cln_GetinfoResponse,
  GetinfoResponse__Output as _cln_GetinfoResponse__Output,
} from '../cln/GetinfoResponse'
import type {
  GetrouteRequest as _cln_GetrouteRequest,
  GetrouteRequest__Output as _cln_GetrouteRequest__Output,
} from '../cln/GetrouteRequest'
import type {
  GetrouteResponse as _cln_GetrouteResponse,
  GetrouteResponse__Output as _cln_GetrouteResponse__Output,
} from '../cln/GetrouteResponse'
import type {
  InvoiceRequest as _cln_InvoiceRequest,
  InvoiceRequest__Output as _cln_InvoiceRequest__Output,
} from '../cln/InvoiceRequest'
import type {
  InvoiceResponse as _cln_InvoiceResponse,
  InvoiceResponse__Output as _cln_InvoiceResponse__Output,
} from '../cln/InvoiceResponse'
import type {
  KeysendRequest as _cln_KeysendRequest,
  KeysendRequest__Output as _cln_KeysendRequest__Output,
} from '../cln/KeysendRequest'
import type {
  KeysendResponse as _cln_KeysendResponse,
  KeysendResponse__Output as _cln_KeysendResponse__Output,
} from '../cln/KeysendResponse'
import type {
  ListchannelsRequest as _cln_ListchannelsRequest,
  ListchannelsRequest__Output as _cln_ListchannelsRequest__Output,
} from '../cln/ListchannelsRequest'
import type {
  ListchannelsResponse as _cln_ListchannelsResponse,
  ListchannelsResponse__Output as _cln_ListchannelsResponse__Output,
} from '../cln/ListchannelsResponse'
import type {
  ListdatastoreRequest as _cln_ListdatastoreRequest,
  ListdatastoreRequest__Output as _cln_ListdatastoreRequest__Output,
} from '../cln/ListdatastoreRequest'
import type {
  ListdatastoreResponse as _cln_ListdatastoreResponse,
  ListdatastoreResponse__Output as _cln_ListdatastoreResponse__Output,
} from '../cln/ListdatastoreResponse'
import type {
  ListforwardsRequest as _cln_ListforwardsRequest,
  ListforwardsRequest__Output as _cln_ListforwardsRequest__Output,
} from '../cln/ListforwardsRequest'
import type {
  ListforwardsResponse as _cln_ListforwardsResponse,
  ListforwardsResponse__Output as _cln_ListforwardsResponse__Output,
} from '../cln/ListforwardsResponse'
import type {
  ListfundsRequest as _cln_ListfundsRequest,
  ListfundsRequest__Output as _cln_ListfundsRequest__Output,
} from '../cln/ListfundsRequest'
import type {
  ListfundsResponse as _cln_ListfundsResponse,
  ListfundsResponse__Output as _cln_ListfundsResponse__Output,
} from '../cln/ListfundsResponse'
import type {
  ListinvoicesRequest as _cln_ListinvoicesRequest,
  ListinvoicesRequest__Output as _cln_ListinvoicesRequest__Output,
} from '../cln/ListinvoicesRequest'
import type {
  ListinvoicesResponse as _cln_ListinvoicesResponse,
  ListinvoicesResponse__Output as _cln_ListinvoicesResponse__Output,
} from '../cln/ListinvoicesResponse'
import type {
  ListnodesRequest as _cln_ListnodesRequest,
  ListnodesRequest__Output as _cln_ListnodesRequest__Output,
} from '../cln/ListnodesRequest'
import type {
  ListnodesResponse as _cln_ListnodesResponse,
  ListnodesResponse__Output as _cln_ListnodesResponse__Output,
} from '../cln/ListnodesResponse'
import type {
  ListpaysRequest as _cln_ListpaysRequest,
  ListpaysRequest__Output as _cln_ListpaysRequest__Output,
} from '../cln/ListpaysRequest'
import type {
  ListpaysResponse as _cln_ListpaysResponse,
  ListpaysResponse__Output as _cln_ListpaysResponse__Output,
} from '../cln/ListpaysResponse'
import type {
  ListpeersRequest as _cln_ListpeersRequest,
  ListpeersRequest__Output as _cln_ListpeersRequest__Output,
} from '../cln/ListpeersRequest'
import type {
  ListpeersResponse as _cln_ListpeersResponse,
  ListpeersResponse__Output as _cln_ListpeersResponse__Output,
} from '../cln/ListpeersResponse'
import type {
  ListsendpaysRequest as _cln_ListsendpaysRequest,
  ListsendpaysRequest__Output as _cln_ListsendpaysRequest__Output,
} from '../cln/ListsendpaysRequest'
import type {
  ListsendpaysResponse as _cln_ListsendpaysResponse,
  ListsendpaysResponse__Output as _cln_ListsendpaysResponse__Output,
} from '../cln/ListsendpaysResponse'
import type {
  ListtransactionsRequest as _cln_ListtransactionsRequest,
  ListtransactionsRequest__Output as _cln_ListtransactionsRequest__Output,
} from '../cln/ListtransactionsRequest'
import type {
  ListtransactionsResponse as _cln_ListtransactionsResponse,
  ListtransactionsResponse__Output as _cln_ListtransactionsResponse__Output,
} from '../cln/ListtransactionsResponse'
import type {
  NewaddrRequest as _cln_NewaddrRequest,
  NewaddrRequest__Output as _cln_NewaddrRequest__Output,
} from '../cln/NewaddrRequest'
import type {
  NewaddrResponse as _cln_NewaddrResponse,
  NewaddrResponse__Output as _cln_NewaddrResponse__Output,
} from '../cln/NewaddrResponse'
import type {
  PayRequest as _cln_PayRequest,
  PayRequest__Output as _cln_PayRequest__Output,
} from '../cln/PayRequest'
import type {
  PayResponse as _cln_PayResponse,
  PayResponse__Output as _cln_PayResponse__Output,
} from '../cln/PayResponse'
import type {
  PingRequest as _cln_PingRequest,
  PingRequest__Output as _cln_PingRequest__Output,
} from '../cln/PingRequest'
import type {
  PingResponse as _cln_PingResponse,
  PingResponse__Output as _cln_PingResponse__Output,
} from '../cln/PingResponse'
import type {
  SendcustommsgRequest as _cln_SendcustommsgRequest,
  SendcustommsgRequest__Output as _cln_SendcustommsgRequest__Output,
} from '../cln/SendcustommsgRequest'
import type {
  SendcustommsgResponse as _cln_SendcustommsgResponse,
  SendcustommsgResponse__Output as _cln_SendcustommsgResponse__Output,
} from '../cln/SendcustommsgResponse'
import type {
  SendonionRequest as _cln_SendonionRequest,
  SendonionRequest__Output as _cln_SendonionRequest__Output,
} from '../cln/SendonionRequest'
import type {
  SendonionResponse as _cln_SendonionResponse,
  SendonionResponse__Output as _cln_SendonionResponse__Output,
} from '../cln/SendonionResponse'
import type {
  SendpayRequest as _cln_SendpayRequest,
  SendpayRequest__Output as _cln_SendpayRequest__Output,
} from '../cln/SendpayRequest'
import type {
  SendpayResponse as _cln_SendpayResponse,
  SendpayResponse__Output as _cln_SendpayResponse__Output,
} from '../cln/SendpayResponse'
import type {
  SendpsbtRequest as _cln_SendpsbtRequest,
  SendpsbtRequest__Output as _cln_SendpsbtRequest__Output,
} from '../cln/SendpsbtRequest'
import type {
  SendpsbtResponse as _cln_SendpsbtResponse,
  SendpsbtResponse__Output as _cln_SendpsbtResponse__Output,
} from '../cln/SendpsbtResponse'
import type {
  SetchannelRequest as _cln_SetchannelRequest,
  SetchannelRequest__Output as _cln_SetchannelRequest__Output,
} from '../cln/SetchannelRequest'
import type {
  SetchannelResponse as _cln_SetchannelResponse,
  SetchannelResponse__Output as _cln_SetchannelResponse__Output,
} from '../cln/SetchannelResponse'
import type {
  SigninvoiceRequest as _cln_SigninvoiceRequest,
  SigninvoiceRequest__Output as _cln_SigninvoiceRequest__Output,
} from '../cln/SigninvoiceRequest'
import type {
  SigninvoiceResponse as _cln_SigninvoiceResponse,
  SigninvoiceResponse__Output as _cln_SigninvoiceResponse__Output,
} from '../cln/SigninvoiceResponse'
import type {
  SignmessageRequest as _cln_SignmessageRequest,
  SignmessageRequest__Output as _cln_SignmessageRequest__Output,
} from '../cln/SignmessageRequest'
import type {
  SignmessageResponse as _cln_SignmessageResponse,
  SignmessageResponse__Output as _cln_SignmessageResponse__Output,
} from '../cln/SignmessageResponse'
import type {
  SignpsbtRequest as _cln_SignpsbtRequest,
  SignpsbtRequest__Output as _cln_SignpsbtRequest__Output,
} from '../cln/SignpsbtRequest'
import type {
  SignpsbtResponse as _cln_SignpsbtResponse,
  SignpsbtResponse__Output as _cln_SignpsbtResponse__Output,
} from '../cln/SignpsbtResponse'
import type {
  StopRequest as _cln_StopRequest,
  StopRequest__Output as _cln_StopRequest__Output,
} from '../cln/StopRequest'
import type {
  StopResponse as _cln_StopResponse,
  StopResponse__Output as _cln_StopResponse__Output,
} from '../cln/StopResponse'
import type {
  TxdiscardRequest as _cln_TxdiscardRequest,
  TxdiscardRequest__Output as _cln_TxdiscardRequest__Output,
} from '../cln/TxdiscardRequest'
import type {
  TxdiscardResponse as _cln_TxdiscardResponse,
  TxdiscardResponse__Output as _cln_TxdiscardResponse__Output,
} from '../cln/TxdiscardResponse'
import type {
  TxprepareRequest as _cln_TxprepareRequest,
  TxprepareRequest__Output as _cln_TxprepareRequest__Output,
} from '../cln/TxprepareRequest'
import type {
  TxprepareResponse as _cln_TxprepareResponse,
  TxprepareResponse__Output as _cln_TxprepareResponse__Output,
} from '../cln/TxprepareResponse'
import type {
  TxsendRequest as _cln_TxsendRequest,
  TxsendRequest__Output as _cln_TxsendRequest__Output,
} from '../cln/TxsendRequest'
import type {
  TxsendResponse as _cln_TxsendResponse,
  TxsendResponse__Output as _cln_TxsendResponse__Output,
} from '../cln/TxsendResponse'
import type {
  UtxopsbtRequest as _cln_UtxopsbtRequest,
  UtxopsbtRequest__Output as _cln_UtxopsbtRequest__Output,
} from '../cln/UtxopsbtRequest'
import type {
  UtxopsbtResponse as _cln_UtxopsbtResponse,
  UtxopsbtResponse__Output as _cln_UtxopsbtResponse__Output,
} from '../cln/UtxopsbtResponse'
import type {
  WaitanyinvoiceRequest as _cln_WaitanyinvoiceRequest,
  WaitanyinvoiceRequest__Output as _cln_WaitanyinvoiceRequest__Output,
} from '../cln/WaitanyinvoiceRequest'
import type {
  WaitanyinvoiceResponse as _cln_WaitanyinvoiceResponse,
  WaitanyinvoiceResponse__Output as _cln_WaitanyinvoiceResponse__Output,
} from '../cln/WaitanyinvoiceResponse'
import type {
  WaitinvoiceRequest as _cln_WaitinvoiceRequest,
  WaitinvoiceRequest__Output as _cln_WaitinvoiceRequest__Output,
} from '../cln/WaitinvoiceRequest'
import type {
  WaitinvoiceResponse as _cln_WaitinvoiceResponse,
  WaitinvoiceResponse__Output as _cln_WaitinvoiceResponse__Output,
} from '../cln/WaitinvoiceResponse'
import type {
  WaitsendpayRequest as _cln_WaitsendpayRequest,
  WaitsendpayRequest__Output as _cln_WaitsendpayRequest__Output,
} from '../cln/WaitsendpayRequest'
import type {
  WaitsendpayResponse as _cln_WaitsendpayResponse,
  WaitsendpayResponse__Output as _cln_WaitsendpayResponse__Output,
} from '../cln/WaitsendpayResponse'
import type {
  WithdrawRequest as _cln_WithdrawRequest,
  WithdrawRequest__Output as _cln_WithdrawRequest__Output,
} from '../cln/WithdrawRequest'
import type {
  WithdrawResponse as _cln_WithdrawResponse,
  WithdrawResponse__Output as _cln_WithdrawResponse__Output,
} from '../cln/WithdrawResponse'

export interface NodeClient extends grpc.Client {
  AddGossip(
    argument: _cln_AddgossipRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_AddgossipResponse__Output>
  ): grpc.ClientUnaryCall
  AddGossip(
    argument: _cln_AddgossipRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_AddgossipResponse__Output>
  ): grpc.ClientUnaryCall
  AddGossip(
    argument: _cln_AddgossipRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_AddgossipResponse__Output>
  ): grpc.ClientUnaryCall
  AddGossip(
    argument: _cln_AddgossipRequest,
    callback: grpc.requestCallback<_cln_AddgossipResponse__Output>
  ): grpc.ClientUnaryCall
  addGossip(
    argument: _cln_AddgossipRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_AddgossipResponse__Output>
  ): grpc.ClientUnaryCall
  addGossip(
    argument: _cln_AddgossipRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_AddgossipResponse__Output>
  ): grpc.ClientUnaryCall
  addGossip(
    argument: _cln_AddgossipRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_AddgossipResponse__Output>
  ): grpc.ClientUnaryCall
  addGossip(
    argument: _cln_AddgossipRequest,
    callback: grpc.requestCallback<_cln_AddgossipResponse__Output>
  ): grpc.ClientUnaryCall

  AutoCleanInvoice(
    argument: _cln_AutocleaninvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_AutocleaninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  AutoCleanInvoice(
    argument: _cln_AutocleaninvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_AutocleaninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  AutoCleanInvoice(
    argument: _cln_AutocleaninvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_AutocleaninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  AutoCleanInvoice(
    argument: _cln_AutocleaninvoiceRequest,
    callback: grpc.requestCallback<_cln_AutocleaninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  autoCleanInvoice(
    argument: _cln_AutocleaninvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_AutocleaninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  autoCleanInvoice(
    argument: _cln_AutocleaninvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_AutocleaninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  autoCleanInvoice(
    argument: _cln_AutocleaninvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_AutocleaninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  autoCleanInvoice(
    argument: _cln_AutocleaninvoiceRequest,
    callback: grpc.requestCallback<_cln_AutocleaninvoiceResponse__Output>
  ): grpc.ClientUnaryCall

  CheckMessage(
    argument: _cln_CheckmessageRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CheckmessageResponse__Output>
  ): grpc.ClientUnaryCall
  CheckMessage(
    argument: _cln_CheckmessageRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_CheckmessageResponse__Output>
  ): grpc.ClientUnaryCall
  CheckMessage(
    argument: _cln_CheckmessageRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CheckmessageResponse__Output>
  ): grpc.ClientUnaryCall
  CheckMessage(
    argument: _cln_CheckmessageRequest,
    callback: grpc.requestCallback<_cln_CheckmessageResponse__Output>
  ): grpc.ClientUnaryCall
  checkMessage(
    argument: _cln_CheckmessageRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CheckmessageResponse__Output>
  ): grpc.ClientUnaryCall
  checkMessage(
    argument: _cln_CheckmessageRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_CheckmessageResponse__Output>
  ): grpc.ClientUnaryCall
  checkMessage(
    argument: _cln_CheckmessageRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CheckmessageResponse__Output>
  ): grpc.ClientUnaryCall
  checkMessage(
    argument: _cln_CheckmessageRequest,
    callback: grpc.requestCallback<_cln_CheckmessageResponse__Output>
  ): grpc.ClientUnaryCall

  Close(
    argument: _cln_CloseRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CloseResponse__Output>
  ): grpc.ClientUnaryCall
  Close(
    argument: _cln_CloseRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_CloseResponse__Output>
  ): grpc.ClientUnaryCall
  Close(
    argument: _cln_CloseRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CloseResponse__Output>
  ): grpc.ClientUnaryCall
  Close(
    argument: _cln_CloseRequest,
    callback: grpc.requestCallback<_cln_CloseResponse__Output>
  ): grpc.ClientUnaryCall

  ConnectPeer(
    argument: _cln_ConnectRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  ConnectPeer(
    argument: _cln_ConnectRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  ConnectPeer(
    argument: _cln_ConnectRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  ConnectPeer(
    argument: _cln_ConnectRequest,
    callback: grpc.requestCallback<_cln_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  connectPeer(
    argument: _cln_ConnectRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  connectPeer(
    argument: _cln_ConnectRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  connectPeer(
    argument: _cln_ConnectRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ConnectResponse__Output>
  ): grpc.ClientUnaryCall
  connectPeer(
    argument: _cln_ConnectRequest,
    callback: grpc.requestCallback<_cln_ConnectResponse__Output>
  ): grpc.ClientUnaryCall

  CreateInvoice(
    argument: _cln_CreateinvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CreateinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  CreateInvoice(
    argument: _cln_CreateinvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_CreateinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  CreateInvoice(
    argument: _cln_CreateinvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CreateinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  CreateInvoice(
    argument: _cln_CreateinvoiceRequest,
    callback: grpc.requestCallback<_cln_CreateinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  createInvoice(
    argument: _cln_CreateinvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CreateinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  createInvoice(
    argument: _cln_CreateinvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_CreateinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  createInvoice(
    argument: _cln_CreateinvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CreateinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  createInvoice(
    argument: _cln_CreateinvoiceRequest,
    callback: grpc.requestCallback<_cln_CreateinvoiceResponse__Output>
  ): grpc.ClientUnaryCall

  CreateOnion(
    argument: _cln_CreateonionRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CreateonionResponse__Output>
  ): grpc.ClientUnaryCall
  CreateOnion(
    argument: _cln_CreateonionRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_CreateonionResponse__Output>
  ): grpc.ClientUnaryCall
  CreateOnion(
    argument: _cln_CreateonionRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CreateonionResponse__Output>
  ): grpc.ClientUnaryCall
  CreateOnion(
    argument: _cln_CreateonionRequest,
    callback: grpc.requestCallback<_cln_CreateonionResponse__Output>
  ): grpc.ClientUnaryCall
  createOnion(
    argument: _cln_CreateonionRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CreateonionResponse__Output>
  ): grpc.ClientUnaryCall
  createOnion(
    argument: _cln_CreateonionRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_CreateonionResponse__Output>
  ): grpc.ClientUnaryCall
  createOnion(
    argument: _cln_CreateonionRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_CreateonionResponse__Output>
  ): grpc.ClientUnaryCall
  createOnion(
    argument: _cln_CreateonionRequest,
    callback: grpc.requestCallback<_cln_CreateonionResponse__Output>
  ): grpc.ClientUnaryCall

  Datastore(
    argument: _cln_DatastoreRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  Datastore(
    argument: _cln_DatastoreRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_DatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  Datastore(
    argument: _cln_DatastoreRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  Datastore(
    argument: _cln_DatastoreRequest,
    callback: grpc.requestCallback<_cln_DatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  datastore(
    argument: _cln_DatastoreRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  datastore(
    argument: _cln_DatastoreRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_DatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  datastore(
    argument: _cln_DatastoreRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  datastore(
    argument: _cln_DatastoreRequest,
    callback: grpc.requestCallback<_cln_DatastoreResponse__Output>
  ): grpc.ClientUnaryCall

  DelDatastore(
    argument: _cln_DeldatastoreRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DeldatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  DelDatastore(
    argument: _cln_DeldatastoreRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_DeldatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  DelDatastore(
    argument: _cln_DeldatastoreRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DeldatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  DelDatastore(
    argument: _cln_DeldatastoreRequest,
    callback: grpc.requestCallback<_cln_DeldatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  delDatastore(
    argument: _cln_DeldatastoreRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DeldatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  delDatastore(
    argument: _cln_DeldatastoreRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_DeldatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  delDatastore(
    argument: _cln_DeldatastoreRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DeldatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  delDatastore(
    argument: _cln_DeldatastoreRequest,
    callback: grpc.requestCallback<_cln_DeldatastoreResponse__Output>
  ): grpc.ClientUnaryCall

  DelExpiredInvoice(
    argument: _cln_DelexpiredinvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DelexpiredinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  DelExpiredInvoice(
    argument: _cln_DelexpiredinvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_DelexpiredinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  DelExpiredInvoice(
    argument: _cln_DelexpiredinvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DelexpiredinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  DelExpiredInvoice(
    argument: _cln_DelexpiredinvoiceRequest,
    callback: grpc.requestCallback<_cln_DelexpiredinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  delExpiredInvoice(
    argument: _cln_DelexpiredinvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DelexpiredinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  delExpiredInvoice(
    argument: _cln_DelexpiredinvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_DelexpiredinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  delExpiredInvoice(
    argument: _cln_DelexpiredinvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DelexpiredinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  delExpiredInvoice(
    argument: _cln_DelexpiredinvoiceRequest,
    callback: grpc.requestCallback<_cln_DelexpiredinvoiceResponse__Output>
  ): grpc.ClientUnaryCall

  DelInvoice(
    argument: _cln_DelinvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DelinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  DelInvoice(
    argument: _cln_DelinvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_DelinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  DelInvoice(
    argument: _cln_DelinvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DelinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  DelInvoice(
    argument: _cln_DelinvoiceRequest,
    callback: grpc.requestCallback<_cln_DelinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  delInvoice(
    argument: _cln_DelinvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DelinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  delInvoice(
    argument: _cln_DelinvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_DelinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  delInvoice(
    argument: _cln_DelinvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DelinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  delInvoice(
    argument: _cln_DelinvoiceRequest,
    callback: grpc.requestCallback<_cln_DelinvoiceResponse__Output>
  ): grpc.ClientUnaryCall

  Disconnect(
    argument: _cln_DisconnectRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  Disconnect(
    argument: _cln_DisconnectRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  Disconnect(
    argument: _cln_DisconnectRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  Disconnect(
    argument: _cln_DisconnectRequest,
    callback: grpc.requestCallback<_cln_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  disconnect(
    argument: _cln_DisconnectRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  disconnect(
    argument: _cln_DisconnectRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  disconnect(
    argument: _cln_DisconnectRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall
  disconnect(
    argument: _cln_DisconnectRequest,
    callback: grpc.requestCallback<_cln_DisconnectResponse__Output>
  ): grpc.ClientUnaryCall

  Feerates(
    argument: _cln_FeeratesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FeeratesResponse__Output>
  ): grpc.ClientUnaryCall
  Feerates(
    argument: _cln_FeeratesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_FeeratesResponse__Output>
  ): grpc.ClientUnaryCall
  Feerates(
    argument: _cln_FeeratesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FeeratesResponse__Output>
  ): grpc.ClientUnaryCall
  Feerates(
    argument: _cln_FeeratesRequest,
    callback: grpc.requestCallback<_cln_FeeratesResponse__Output>
  ): grpc.ClientUnaryCall
  feerates(
    argument: _cln_FeeratesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FeeratesResponse__Output>
  ): grpc.ClientUnaryCall
  feerates(
    argument: _cln_FeeratesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_FeeratesResponse__Output>
  ): grpc.ClientUnaryCall
  feerates(
    argument: _cln_FeeratesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FeeratesResponse__Output>
  ): grpc.ClientUnaryCall
  feerates(
    argument: _cln_FeeratesRequest,
    callback: grpc.requestCallback<_cln_FeeratesResponse__Output>
  ): grpc.ClientUnaryCall

  FundChannel(
    argument: _cln_FundchannelRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FundchannelResponse__Output>
  ): grpc.ClientUnaryCall
  FundChannel(
    argument: _cln_FundchannelRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_FundchannelResponse__Output>
  ): grpc.ClientUnaryCall
  FundChannel(
    argument: _cln_FundchannelRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FundchannelResponse__Output>
  ): grpc.ClientUnaryCall
  FundChannel(
    argument: _cln_FundchannelRequest,
    callback: grpc.requestCallback<_cln_FundchannelResponse__Output>
  ): grpc.ClientUnaryCall
  fundChannel(
    argument: _cln_FundchannelRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FundchannelResponse__Output>
  ): grpc.ClientUnaryCall
  fundChannel(
    argument: _cln_FundchannelRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_FundchannelResponse__Output>
  ): grpc.ClientUnaryCall
  fundChannel(
    argument: _cln_FundchannelRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FundchannelResponse__Output>
  ): grpc.ClientUnaryCall
  fundChannel(
    argument: _cln_FundchannelRequest,
    callback: grpc.requestCallback<_cln_FundchannelResponse__Output>
  ): grpc.ClientUnaryCall

  FundPsbt(
    argument: _cln_FundpsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FundpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  FundPsbt(
    argument: _cln_FundpsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_FundpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  FundPsbt(
    argument: _cln_FundpsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FundpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  FundPsbt(
    argument: _cln_FundpsbtRequest,
    callback: grpc.requestCallback<_cln_FundpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  fundPsbt(
    argument: _cln_FundpsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FundpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  fundPsbt(
    argument: _cln_FundpsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_FundpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  fundPsbt(
    argument: _cln_FundpsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_FundpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  fundPsbt(
    argument: _cln_FundpsbtRequest,
    callback: grpc.requestCallback<_cln_FundpsbtResponse__Output>
  ): grpc.ClientUnaryCall

  GetRoute(
    argument: _cln_GetrouteRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_GetrouteResponse__Output>
  ): grpc.ClientUnaryCall
  GetRoute(
    argument: _cln_GetrouteRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_GetrouteResponse__Output>
  ): grpc.ClientUnaryCall
  GetRoute(
    argument: _cln_GetrouteRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_GetrouteResponse__Output>
  ): grpc.ClientUnaryCall
  GetRoute(
    argument: _cln_GetrouteRequest,
    callback: grpc.requestCallback<_cln_GetrouteResponse__Output>
  ): grpc.ClientUnaryCall
  getRoute(
    argument: _cln_GetrouteRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_GetrouteResponse__Output>
  ): grpc.ClientUnaryCall
  getRoute(
    argument: _cln_GetrouteRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_GetrouteResponse__Output>
  ): grpc.ClientUnaryCall
  getRoute(
    argument: _cln_GetrouteRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_GetrouteResponse__Output>
  ): grpc.ClientUnaryCall
  getRoute(
    argument: _cln_GetrouteRequest,
    callback: grpc.requestCallback<_cln_GetrouteResponse__Output>
  ): grpc.ClientUnaryCall

  Getinfo(
    argument: _cln_GetinfoRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_GetinfoResponse__Output>
  ): grpc.ClientUnaryCall
  Getinfo(
    argument: _cln_GetinfoRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_GetinfoResponse__Output>
  ): grpc.ClientUnaryCall
  Getinfo(
    argument: _cln_GetinfoRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_GetinfoResponse__Output>
  ): grpc.ClientUnaryCall
  Getinfo(
    argument: _cln_GetinfoRequest,
    callback: grpc.requestCallback<_cln_GetinfoResponse__Output>
  ): grpc.ClientUnaryCall
  getinfo(
    argument: _cln_GetinfoRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_GetinfoResponse__Output>
  ): grpc.ClientUnaryCall
  getinfo(
    argument: _cln_GetinfoRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_GetinfoResponse__Output>
  ): grpc.ClientUnaryCall
  getinfo(
    argument: _cln_GetinfoRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_GetinfoResponse__Output>
  ): grpc.ClientUnaryCall
  getinfo(
    argument: _cln_GetinfoRequest,
    callback: grpc.requestCallback<_cln_GetinfoResponse__Output>
  ): grpc.ClientUnaryCall

  Invoice(
    argument: _cln_InvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_InvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  Invoice(
    argument: _cln_InvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_InvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  Invoice(
    argument: _cln_InvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_InvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  Invoice(
    argument: _cln_InvoiceRequest,
    callback: grpc.requestCallback<_cln_InvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  invoice(
    argument: _cln_InvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_InvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  invoice(
    argument: _cln_InvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_InvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  invoice(
    argument: _cln_InvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_InvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  invoice(
    argument: _cln_InvoiceRequest,
    callback: grpc.requestCallback<_cln_InvoiceResponse__Output>
  ): grpc.ClientUnaryCall

  KeySend(
    argument: _cln_KeysendRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_KeysendResponse__Output>
  ): grpc.ClientUnaryCall
  KeySend(
    argument: _cln_KeysendRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_KeysendResponse__Output>
  ): grpc.ClientUnaryCall
  KeySend(
    argument: _cln_KeysendRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_KeysendResponse__Output>
  ): grpc.ClientUnaryCall
  KeySend(
    argument: _cln_KeysendRequest,
    callback: grpc.requestCallback<_cln_KeysendResponse__Output>
  ): grpc.ClientUnaryCall
  keySend(
    argument: _cln_KeysendRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_KeysendResponse__Output>
  ): grpc.ClientUnaryCall
  keySend(
    argument: _cln_KeysendRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_KeysendResponse__Output>
  ): grpc.ClientUnaryCall
  keySend(
    argument: _cln_KeysendRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_KeysendResponse__Output>
  ): grpc.ClientUnaryCall
  keySend(
    argument: _cln_KeysendRequest,
    callback: grpc.requestCallback<_cln_KeysendResponse__Output>
  ): grpc.ClientUnaryCall

  ListChannels(
    argument: _cln_ListchannelsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListchannelsResponse__Output>
  ): grpc.ClientUnaryCall
  ListChannels(
    argument: _cln_ListchannelsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListchannelsResponse__Output>
  ): grpc.ClientUnaryCall
  ListChannels(
    argument: _cln_ListchannelsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListchannelsResponse__Output>
  ): grpc.ClientUnaryCall
  ListChannels(
    argument: _cln_ListchannelsRequest,
    callback: grpc.requestCallback<_cln_ListchannelsResponse__Output>
  ): grpc.ClientUnaryCall
  listChannels(
    argument: _cln_ListchannelsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListchannelsResponse__Output>
  ): grpc.ClientUnaryCall
  listChannels(
    argument: _cln_ListchannelsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListchannelsResponse__Output>
  ): grpc.ClientUnaryCall
  listChannels(
    argument: _cln_ListchannelsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListchannelsResponse__Output>
  ): grpc.ClientUnaryCall
  listChannels(
    argument: _cln_ListchannelsRequest,
    callback: grpc.requestCallback<_cln_ListchannelsResponse__Output>
  ): grpc.ClientUnaryCall

  ListDatastore(
    argument: _cln_ListdatastoreRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListdatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  ListDatastore(
    argument: _cln_ListdatastoreRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListdatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  ListDatastore(
    argument: _cln_ListdatastoreRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListdatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  ListDatastore(
    argument: _cln_ListdatastoreRequest,
    callback: grpc.requestCallback<_cln_ListdatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  listDatastore(
    argument: _cln_ListdatastoreRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListdatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  listDatastore(
    argument: _cln_ListdatastoreRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListdatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  listDatastore(
    argument: _cln_ListdatastoreRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListdatastoreResponse__Output>
  ): grpc.ClientUnaryCall
  listDatastore(
    argument: _cln_ListdatastoreRequest,
    callback: grpc.requestCallback<_cln_ListdatastoreResponse__Output>
  ): grpc.ClientUnaryCall

  ListForwards(
    argument: _cln_ListforwardsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListforwardsResponse__Output>
  ): grpc.ClientUnaryCall
  ListForwards(
    argument: _cln_ListforwardsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListforwardsResponse__Output>
  ): grpc.ClientUnaryCall
  ListForwards(
    argument: _cln_ListforwardsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListforwardsResponse__Output>
  ): grpc.ClientUnaryCall
  ListForwards(
    argument: _cln_ListforwardsRequest,
    callback: grpc.requestCallback<_cln_ListforwardsResponse__Output>
  ): grpc.ClientUnaryCall
  listForwards(
    argument: _cln_ListforwardsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListforwardsResponse__Output>
  ): grpc.ClientUnaryCall
  listForwards(
    argument: _cln_ListforwardsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListforwardsResponse__Output>
  ): grpc.ClientUnaryCall
  listForwards(
    argument: _cln_ListforwardsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListforwardsResponse__Output>
  ): grpc.ClientUnaryCall
  listForwards(
    argument: _cln_ListforwardsRequest,
    callback: grpc.requestCallback<_cln_ListforwardsResponse__Output>
  ): grpc.ClientUnaryCall

  ListFunds(
    argument: _cln_ListfundsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListfundsResponse__Output>
  ): grpc.ClientUnaryCall
  ListFunds(
    argument: _cln_ListfundsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListfundsResponse__Output>
  ): grpc.ClientUnaryCall
  ListFunds(
    argument: _cln_ListfundsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListfundsResponse__Output>
  ): grpc.ClientUnaryCall
  ListFunds(
    argument: _cln_ListfundsRequest,
    callback: grpc.requestCallback<_cln_ListfundsResponse__Output>
  ): grpc.ClientUnaryCall
  listFunds(
    argument: _cln_ListfundsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListfundsResponse__Output>
  ): grpc.ClientUnaryCall
  listFunds(
    argument: _cln_ListfundsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListfundsResponse__Output>
  ): grpc.ClientUnaryCall
  listFunds(
    argument: _cln_ListfundsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListfundsResponse__Output>
  ): grpc.ClientUnaryCall
  listFunds(
    argument: _cln_ListfundsRequest,
    callback: grpc.requestCallback<_cln_ListfundsResponse__Output>
  ): grpc.ClientUnaryCall

  ListInvoices(
    argument: _cln_ListinvoicesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListinvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  ListInvoices(
    argument: _cln_ListinvoicesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListinvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  ListInvoices(
    argument: _cln_ListinvoicesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListinvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  ListInvoices(
    argument: _cln_ListinvoicesRequest,
    callback: grpc.requestCallback<_cln_ListinvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  listInvoices(
    argument: _cln_ListinvoicesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListinvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  listInvoices(
    argument: _cln_ListinvoicesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListinvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  listInvoices(
    argument: _cln_ListinvoicesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListinvoicesResponse__Output>
  ): grpc.ClientUnaryCall
  listInvoices(
    argument: _cln_ListinvoicesRequest,
    callback: grpc.requestCallback<_cln_ListinvoicesResponse__Output>
  ): grpc.ClientUnaryCall

  ListNodes(
    argument: _cln_ListnodesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListnodesResponse__Output>
  ): grpc.ClientUnaryCall
  ListNodes(
    argument: _cln_ListnodesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListnodesResponse__Output>
  ): grpc.ClientUnaryCall
  ListNodes(
    argument: _cln_ListnodesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListnodesResponse__Output>
  ): grpc.ClientUnaryCall
  ListNodes(
    argument: _cln_ListnodesRequest,
    callback: grpc.requestCallback<_cln_ListnodesResponse__Output>
  ): grpc.ClientUnaryCall
  listNodes(
    argument: _cln_ListnodesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListnodesResponse__Output>
  ): grpc.ClientUnaryCall
  listNodes(
    argument: _cln_ListnodesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListnodesResponse__Output>
  ): grpc.ClientUnaryCall
  listNodes(
    argument: _cln_ListnodesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListnodesResponse__Output>
  ): grpc.ClientUnaryCall
  listNodes(
    argument: _cln_ListnodesRequest,
    callback: grpc.requestCallback<_cln_ListnodesResponse__Output>
  ): grpc.ClientUnaryCall

  ListPays(
    argument: _cln_ListpaysRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListpaysResponse__Output>
  ): grpc.ClientUnaryCall
  ListPays(
    argument: _cln_ListpaysRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListpaysResponse__Output>
  ): grpc.ClientUnaryCall
  ListPays(
    argument: _cln_ListpaysRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListpaysResponse__Output>
  ): grpc.ClientUnaryCall
  ListPays(
    argument: _cln_ListpaysRequest,
    callback: grpc.requestCallback<_cln_ListpaysResponse__Output>
  ): grpc.ClientUnaryCall
  listPays(
    argument: _cln_ListpaysRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListpaysResponse__Output>
  ): grpc.ClientUnaryCall
  listPays(
    argument: _cln_ListpaysRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListpaysResponse__Output>
  ): grpc.ClientUnaryCall
  listPays(
    argument: _cln_ListpaysRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListpaysResponse__Output>
  ): grpc.ClientUnaryCall
  listPays(
    argument: _cln_ListpaysRequest,
    callback: grpc.requestCallback<_cln_ListpaysResponse__Output>
  ): grpc.ClientUnaryCall

  ListPeers(
    argument: _cln_ListpeersRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListpeersResponse__Output>
  ): grpc.ClientUnaryCall
  ListPeers(
    argument: _cln_ListpeersRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListpeersResponse__Output>
  ): grpc.ClientUnaryCall
  ListPeers(
    argument: _cln_ListpeersRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListpeersResponse__Output>
  ): grpc.ClientUnaryCall
  ListPeers(
    argument: _cln_ListpeersRequest,
    callback: grpc.requestCallback<_cln_ListpeersResponse__Output>
  ): grpc.ClientUnaryCall
  listPeers(
    argument: _cln_ListpeersRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListpeersResponse__Output>
  ): grpc.ClientUnaryCall
  listPeers(
    argument: _cln_ListpeersRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListpeersResponse__Output>
  ): grpc.ClientUnaryCall
  listPeers(
    argument: _cln_ListpeersRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListpeersResponse__Output>
  ): grpc.ClientUnaryCall
  listPeers(
    argument: _cln_ListpeersRequest,
    callback: grpc.requestCallback<_cln_ListpeersResponse__Output>
  ): grpc.ClientUnaryCall

  ListSendPays(
    argument: _cln_ListsendpaysRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListsendpaysResponse__Output>
  ): grpc.ClientUnaryCall
  ListSendPays(
    argument: _cln_ListsendpaysRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListsendpaysResponse__Output>
  ): grpc.ClientUnaryCall
  ListSendPays(
    argument: _cln_ListsendpaysRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListsendpaysResponse__Output>
  ): grpc.ClientUnaryCall
  ListSendPays(
    argument: _cln_ListsendpaysRequest,
    callback: grpc.requestCallback<_cln_ListsendpaysResponse__Output>
  ): grpc.ClientUnaryCall
  listSendPays(
    argument: _cln_ListsendpaysRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListsendpaysResponse__Output>
  ): grpc.ClientUnaryCall
  listSendPays(
    argument: _cln_ListsendpaysRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListsendpaysResponse__Output>
  ): grpc.ClientUnaryCall
  listSendPays(
    argument: _cln_ListsendpaysRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListsendpaysResponse__Output>
  ): grpc.ClientUnaryCall
  listSendPays(
    argument: _cln_ListsendpaysRequest,
    callback: grpc.requestCallback<_cln_ListsendpaysResponse__Output>
  ): grpc.ClientUnaryCall

  ListTransactions(
    argument: _cln_ListtransactionsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListtransactionsResponse__Output>
  ): grpc.ClientUnaryCall
  ListTransactions(
    argument: _cln_ListtransactionsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListtransactionsResponse__Output>
  ): grpc.ClientUnaryCall
  ListTransactions(
    argument: _cln_ListtransactionsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListtransactionsResponse__Output>
  ): grpc.ClientUnaryCall
  ListTransactions(
    argument: _cln_ListtransactionsRequest,
    callback: grpc.requestCallback<_cln_ListtransactionsResponse__Output>
  ): grpc.ClientUnaryCall
  listTransactions(
    argument: _cln_ListtransactionsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListtransactionsResponse__Output>
  ): grpc.ClientUnaryCall
  listTransactions(
    argument: _cln_ListtransactionsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_ListtransactionsResponse__Output>
  ): grpc.ClientUnaryCall
  listTransactions(
    argument: _cln_ListtransactionsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_ListtransactionsResponse__Output>
  ): grpc.ClientUnaryCall
  listTransactions(
    argument: _cln_ListtransactionsRequest,
    callback: grpc.requestCallback<_cln_ListtransactionsResponse__Output>
  ): grpc.ClientUnaryCall

  NewAddr(
    argument: _cln_NewaddrRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_NewaddrResponse__Output>
  ): grpc.ClientUnaryCall
  NewAddr(
    argument: _cln_NewaddrRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_NewaddrResponse__Output>
  ): grpc.ClientUnaryCall
  NewAddr(
    argument: _cln_NewaddrRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_NewaddrResponse__Output>
  ): grpc.ClientUnaryCall
  NewAddr(
    argument: _cln_NewaddrRequest,
    callback: grpc.requestCallback<_cln_NewaddrResponse__Output>
  ): grpc.ClientUnaryCall
  newAddr(
    argument: _cln_NewaddrRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_NewaddrResponse__Output>
  ): grpc.ClientUnaryCall
  newAddr(
    argument: _cln_NewaddrRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_NewaddrResponse__Output>
  ): grpc.ClientUnaryCall
  newAddr(
    argument: _cln_NewaddrRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_NewaddrResponse__Output>
  ): grpc.ClientUnaryCall
  newAddr(
    argument: _cln_NewaddrRequest,
    callback: grpc.requestCallback<_cln_NewaddrResponse__Output>
  ): grpc.ClientUnaryCall

  Pay(
    argument: _cln_PayRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_PayResponse__Output>
  ): grpc.ClientUnaryCall
  Pay(
    argument: _cln_PayRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_PayResponse__Output>
  ): grpc.ClientUnaryCall
  Pay(
    argument: _cln_PayRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_PayResponse__Output>
  ): grpc.ClientUnaryCall
  Pay(
    argument: _cln_PayRequest,
    callback: grpc.requestCallback<_cln_PayResponse__Output>
  ): grpc.ClientUnaryCall
  pay(
    argument: _cln_PayRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_PayResponse__Output>
  ): grpc.ClientUnaryCall
  pay(
    argument: _cln_PayRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_PayResponse__Output>
  ): grpc.ClientUnaryCall
  pay(
    argument: _cln_PayRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_PayResponse__Output>
  ): grpc.ClientUnaryCall
  pay(
    argument: _cln_PayRequest,
    callback: grpc.requestCallback<_cln_PayResponse__Output>
  ): grpc.ClientUnaryCall

  Ping(
    argument: _cln_PingRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_PingResponse__Output>
  ): grpc.ClientUnaryCall
  Ping(
    argument: _cln_PingRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_PingResponse__Output>
  ): grpc.ClientUnaryCall
  Ping(
    argument: _cln_PingRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_PingResponse__Output>
  ): grpc.ClientUnaryCall
  Ping(
    argument: _cln_PingRequest,
    callback: grpc.requestCallback<_cln_PingResponse__Output>
  ): grpc.ClientUnaryCall
  ping(
    argument: _cln_PingRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_PingResponse__Output>
  ): grpc.ClientUnaryCall
  ping(
    argument: _cln_PingRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_PingResponse__Output>
  ): grpc.ClientUnaryCall
  ping(
    argument: _cln_PingRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_PingResponse__Output>
  ): grpc.ClientUnaryCall
  ping(
    argument: _cln_PingRequest,
    callback: grpc.requestCallback<_cln_PingResponse__Output>
  ): grpc.ClientUnaryCall

  SendCustomMsg(
    argument: _cln_SendcustommsgRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendcustommsgResponse__Output>
  ): grpc.ClientUnaryCall
  SendCustomMsg(
    argument: _cln_SendcustommsgRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SendcustommsgResponse__Output>
  ): grpc.ClientUnaryCall
  SendCustomMsg(
    argument: _cln_SendcustommsgRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendcustommsgResponse__Output>
  ): grpc.ClientUnaryCall
  SendCustomMsg(
    argument: _cln_SendcustommsgRequest,
    callback: grpc.requestCallback<_cln_SendcustommsgResponse__Output>
  ): grpc.ClientUnaryCall
  sendCustomMsg(
    argument: _cln_SendcustommsgRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendcustommsgResponse__Output>
  ): grpc.ClientUnaryCall
  sendCustomMsg(
    argument: _cln_SendcustommsgRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SendcustommsgResponse__Output>
  ): grpc.ClientUnaryCall
  sendCustomMsg(
    argument: _cln_SendcustommsgRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendcustommsgResponse__Output>
  ): grpc.ClientUnaryCall
  sendCustomMsg(
    argument: _cln_SendcustommsgRequest,
    callback: grpc.requestCallback<_cln_SendcustommsgResponse__Output>
  ): grpc.ClientUnaryCall

  SendOnion(
    argument: _cln_SendonionRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendonionResponse__Output>
  ): grpc.ClientUnaryCall
  SendOnion(
    argument: _cln_SendonionRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SendonionResponse__Output>
  ): grpc.ClientUnaryCall
  SendOnion(
    argument: _cln_SendonionRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendonionResponse__Output>
  ): grpc.ClientUnaryCall
  SendOnion(
    argument: _cln_SendonionRequest,
    callback: grpc.requestCallback<_cln_SendonionResponse__Output>
  ): grpc.ClientUnaryCall
  sendOnion(
    argument: _cln_SendonionRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendonionResponse__Output>
  ): grpc.ClientUnaryCall
  sendOnion(
    argument: _cln_SendonionRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SendonionResponse__Output>
  ): grpc.ClientUnaryCall
  sendOnion(
    argument: _cln_SendonionRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendonionResponse__Output>
  ): grpc.ClientUnaryCall
  sendOnion(
    argument: _cln_SendonionRequest,
    callback: grpc.requestCallback<_cln_SendonionResponse__Output>
  ): grpc.ClientUnaryCall

  SendPay(
    argument: _cln_SendpayRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendpayResponse__Output>
  ): grpc.ClientUnaryCall
  SendPay(
    argument: _cln_SendpayRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SendpayResponse__Output>
  ): grpc.ClientUnaryCall
  SendPay(
    argument: _cln_SendpayRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendpayResponse__Output>
  ): grpc.ClientUnaryCall
  SendPay(
    argument: _cln_SendpayRequest,
    callback: grpc.requestCallback<_cln_SendpayResponse__Output>
  ): grpc.ClientUnaryCall
  sendPay(
    argument: _cln_SendpayRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendpayResponse__Output>
  ): grpc.ClientUnaryCall
  sendPay(
    argument: _cln_SendpayRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SendpayResponse__Output>
  ): grpc.ClientUnaryCall
  sendPay(
    argument: _cln_SendpayRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendpayResponse__Output>
  ): grpc.ClientUnaryCall
  sendPay(
    argument: _cln_SendpayRequest,
    callback: grpc.requestCallback<_cln_SendpayResponse__Output>
  ): grpc.ClientUnaryCall

  SendPsbt(
    argument: _cln_SendpsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  SendPsbt(
    argument: _cln_SendpsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SendpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  SendPsbt(
    argument: _cln_SendpsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  SendPsbt(
    argument: _cln_SendpsbtRequest,
    callback: grpc.requestCallback<_cln_SendpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  sendPsbt(
    argument: _cln_SendpsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  sendPsbt(
    argument: _cln_SendpsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SendpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  sendPsbt(
    argument: _cln_SendpsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SendpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  sendPsbt(
    argument: _cln_SendpsbtRequest,
    callback: grpc.requestCallback<_cln_SendpsbtResponse__Output>
  ): grpc.ClientUnaryCall

  SetChannel(
    argument: _cln_SetchannelRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SetchannelResponse__Output>
  ): grpc.ClientUnaryCall
  SetChannel(
    argument: _cln_SetchannelRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SetchannelResponse__Output>
  ): grpc.ClientUnaryCall
  SetChannel(
    argument: _cln_SetchannelRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SetchannelResponse__Output>
  ): grpc.ClientUnaryCall
  SetChannel(
    argument: _cln_SetchannelRequest,
    callback: grpc.requestCallback<_cln_SetchannelResponse__Output>
  ): grpc.ClientUnaryCall
  setChannel(
    argument: _cln_SetchannelRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SetchannelResponse__Output>
  ): grpc.ClientUnaryCall
  setChannel(
    argument: _cln_SetchannelRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SetchannelResponse__Output>
  ): grpc.ClientUnaryCall
  setChannel(
    argument: _cln_SetchannelRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SetchannelResponse__Output>
  ): grpc.ClientUnaryCall
  setChannel(
    argument: _cln_SetchannelRequest,
    callback: grpc.requestCallback<_cln_SetchannelResponse__Output>
  ): grpc.ClientUnaryCall

  SignInvoice(
    argument: _cln_SigninvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SigninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  SignInvoice(
    argument: _cln_SigninvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SigninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  SignInvoice(
    argument: _cln_SigninvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SigninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  SignInvoice(
    argument: _cln_SigninvoiceRequest,
    callback: grpc.requestCallback<_cln_SigninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  signInvoice(
    argument: _cln_SigninvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SigninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  signInvoice(
    argument: _cln_SigninvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SigninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  signInvoice(
    argument: _cln_SigninvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SigninvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  signInvoice(
    argument: _cln_SigninvoiceRequest,
    callback: grpc.requestCallback<_cln_SigninvoiceResponse__Output>
  ): grpc.ClientUnaryCall

  SignMessage(
    argument: _cln_SignmessageRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SignmessageResponse__Output>
  ): grpc.ClientUnaryCall
  SignMessage(
    argument: _cln_SignmessageRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SignmessageResponse__Output>
  ): grpc.ClientUnaryCall
  SignMessage(
    argument: _cln_SignmessageRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SignmessageResponse__Output>
  ): grpc.ClientUnaryCall
  SignMessage(
    argument: _cln_SignmessageRequest,
    callback: grpc.requestCallback<_cln_SignmessageResponse__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _cln_SignmessageRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SignmessageResponse__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _cln_SignmessageRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SignmessageResponse__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _cln_SignmessageRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SignmessageResponse__Output>
  ): grpc.ClientUnaryCall
  signMessage(
    argument: _cln_SignmessageRequest,
    callback: grpc.requestCallback<_cln_SignmessageResponse__Output>
  ): grpc.ClientUnaryCall

  SignPsbt(
    argument: _cln_SignpsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SignpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  SignPsbt(
    argument: _cln_SignpsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SignpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  SignPsbt(
    argument: _cln_SignpsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SignpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  SignPsbt(
    argument: _cln_SignpsbtRequest,
    callback: grpc.requestCallback<_cln_SignpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  signPsbt(
    argument: _cln_SignpsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SignpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  signPsbt(
    argument: _cln_SignpsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_SignpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  signPsbt(
    argument: _cln_SignpsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_SignpsbtResponse__Output>
  ): grpc.ClientUnaryCall
  signPsbt(
    argument: _cln_SignpsbtRequest,
    callback: grpc.requestCallback<_cln_SignpsbtResponse__Output>
  ): grpc.ClientUnaryCall

  Stop(
    argument: _cln_StopRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_StopResponse__Output>
  ): grpc.ClientUnaryCall
  Stop(
    argument: _cln_StopRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_StopResponse__Output>
  ): grpc.ClientUnaryCall
  Stop(
    argument: _cln_StopRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_StopResponse__Output>
  ): grpc.ClientUnaryCall
  Stop(
    argument: _cln_StopRequest,
    callback: grpc.requestCallback<_cln_StopResponse__Output>
  ): grpc.ClientUnaryCall
  stop(
    argument: _cln_StopRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_StopResponse__Output>
  ): grpc.ClientUnaryCall
  stop(
    argument: _cln_StopRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_StopResponse__Output>
  ): grpc.ClientUnaryCall
  stop(
    argument: _cln_StopRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_StopResponse__Output>
  ): grpc.ClientUnaryCall
  stop(
    argument: _cln_StopRequest,
    callback: grpc.requestCallback<_cln_StopResponse__Output>
  ): grpc.ClientUnaryCall

  TxDiscard(
    argument: _cln_TxdiscardRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxdiscardResponse__Output>
  ): grpc.ClientUnaryCall
  TxDiscard(
    argument: _cln_TxdiscardRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_TxdiscardResponse__Output>
  ): grpc.ClientUnaryCall
  TxDiscard(
    argument: _cln_TxdiscardRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxdiscardResponse__Output>
  ): grpc.ClientUnaryCall
  TxDiscard(
    argument: _cln_TxdiscardRequest,
    callback: grpc.requestCallback<_cln_TxdiscardResponse__Output>
  ): grpc.ClientUnaryCall
  txDiscard(
    argument: _cln_TxdiscardRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxdiscardResponse__Output>
  ): grpc.ClientUnaryCall
  txDiscard(
    argument: _cln_TxdiscardRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_TxdiscardResponse__Output>
  ): grpc.ClientUnaryCall
  txDiscard(
    argument: _cln_TxdiscardRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxdiscardResponse__Output>
  ): grpc.ClientUnaryCall
  txDiscard(
    argument: _cln_TxdiscardRequest,
    callback: grpc.requestCallback<_cln_TxdiscardResponse__Output>
  ): grpc.ClientUnaryCall

  TxPrepare(
    argument: _cln_TxprepareRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxprepareResponse__Output>
  ): grpc.ClientUnaryCall
  TxPrepare(
    argument: _cln_TxprepareRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_TxprepareResponse__Output>
  ): grpc.ClientUnaryCall
  TxPrepare(
    argument: _cln_TxprepareRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxprepareResponse__Output>
  ): grpc.ClientUnaryCall
  TxPrepare(
    argument: _cln_TxprepareRequest,
    callback: grpc.requestCallback<_cln_TxprepareResponse__Output>
  ): grpc.ClientUnaryCall
  txPrepare(
    argument: _cln_TxprepareRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxprepareResponse__Output>
  ): grpc.ClientUnaryCall
  txPrepare(
    argument: _cln_TxprepareRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_TxprepareResponse__Output>
  ): grpc.ClientUnaryCall
  txPrepare(
    argument: _cln_TxprepareRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxprepareResponse__Output>
  ): grpc.ClientUnaryCall
  txPrepare(
    argument: _cln_TxprepareRequest,
    callback: grpc.requestCallback<_cln_TxprepareResponse__Output>
  ): grpc.ClientUnaryCall

  TxSend(
    argument: _cln_TxsendRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxsendResponse__Output>
  ): grpc.ClientUnaryCall
  TxSend(
    argument: _cln_TxsendRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_TxsendResponse__Output>
  ): grpc.ClientUnaryCall
  TxSend(
    argument: _cln_TxsendRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxsendResponse__Output>
  ): grpc.ClientUnaryCall
  TxSend(
    argument: _cln_TxsendRequest,
    callback: grpc.requestCallback<_cln_TxsendResponse__Output>
  ): grpc.ClientUnaryCall
  txSend(
    argument: _cln_TxsendRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxsendResponse__Output>
  ): grpc.ClientUnaryCall
  txSend(
    argument: _cln_TxsendRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_TxsendResponse__Output>
  ): grpc.ClientUnaryCall
  txSend(
    argument: _cln_TxsendRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_TxsendResponse__Output>
  ): grpc.ClientUnaryCall
  txSend(
    argument: _cln_TxsendRequest,
    callback: grpc.requestCallback<_cln_TxsendResponse__Output>
  ): grpc.ClientUnaryCall

  UtxoPsbt(
    argument: _cln_UtxopsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_UtxopsbtResponse__Output>
  ): grpc.ClientUnaryCall
  UtxoPsbt(
    argument: _cln_UtxopsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_UtxopsbtResponse__Output>
  ): grpc.ClientUnaryCall
  UtxoPsbt(
    argument: _cln_UtxopsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_UtxopsbtResponse__Output>
  ): grpc.ClientUnaryCall
  UtxoPsbt(
    argument: _cln_UtxopsbtRequest,
    callback: grpc.requestCallback<_cln_UtxopsbtResponse__Output>
  ): grpc.ClientUnaryCall
  utxoPsbt(
    argument: _cln_UtxopsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_UtxopsbtResponse__Output>
  ): grpc.ClientUnaryCall
  utxoPsbt(
    argument: _cln_UtxopsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_UtxopsbtResponse__Output>
  ): grpc.ClientUnaryCall
  utxoPsbt(
    argument: _cln_UtxopsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_UtxopsbtResponse__Output>
  ): grpc.ClientUnaryCall
  utxoPsbt(
    argument: _cln_UtxopsbtRequest,
    callback: grpc.requestCallback<_cln_UtxopsbtResponse__Output>
  ): grpc.ClientUnaryCall

  WaitAnyInvoice(
    argument: _cln_WaitanyinvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitanyinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  WaitAnyInvoice(
    argument: _cln_WaitanyinvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_WaitanyinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  WaitAnyInvoice(
    argument: _cln_WaitanyinvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitanyinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  WaitAnyInvoice(
    argument: _cln_WaitanyinvoiceRequest,
    callback: grpc.requestCallback<_cln_WaitanyinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  waitAnyInvoice(
    argument: _cln_WaitanyinvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitanyinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  waitAnyInvoice(
    argument: _cln_WaitanyinvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_WaitanyinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  waitAnyInvoice(
    argument: _cln_WaitanyinvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitanyinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  waitAnyInvoice(
    argument: _cln_WaitanyinvoiceRequest,
    callback: grpc.requestCallback<_cln_WaitanyinvoiceResponse__Output>
  ): grpc.ClientUnaryCall

  WaitInvoice(
    argument: _cln_WaitinvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  WaitInvoice(
    argument: _cln_WaitinvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_WaitinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  WaitInvoice(
    argument: _cln_WaitinvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  WaitInvoice(
    argument: _cln_WaitinvoiceRequest,
    callback: grpc.requestCallback<_cln_WaitinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  waitInvoice(
    argument: _cln_WaitinvoiceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  waitInvoice(
    argument: _cln_WaitinvoiceRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_WaitinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  waitInvoice(
    argument: _cln_WaitinvoiceRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitinvoiceResponse__Output>
  ): grpc.ClientUnaryCall
  waitInvoice(
    argument: _cln_WaitinvoiceRequest,
    callback: grpc.requestCallback<_cln_WaitinvoiceResponse__Output>
  ): grpc.ClientUnaryCall

  WaitSendPay(
    argument: _cln_WaitsendpayRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitsendpayResponse__Output>
  ): grpc.ClientUnaryCall
  WaitSendPay(
    argument: _cln_WaitsendpayRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_WaitsendpayResponse__Output>
  ): grpc.ClientUnaryCall
  WaitSendPay(
    argument: _cln_WaitsendpayRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitsendpayResponse__Output>
  ): grpc.ClientUnaryCall
  WaitSendPay(
    argument: _cln_WaitsendpayRequest,
    callback: grpc.requestCallback<_cln_WaitsendpayResponse__Output>
  ): grpc.ClientUnaryCall
  waitSendPay(
    argument: _cln_WaitsendpayRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitsendpayResponse__Output>
  ): grpc.ClientUnaryCall
  waitSendPay(
    argument: _cln_WaitsendpayRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_WaitsendpayResponse__Output>
  ): grpc.ClientUnaryCall
  waitSendPay(
    argument: _cln_WaitsendpayRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WaitsendpayResponse__Output>
  ): grpc.ClientUnaryCall
  waitSendPay(
    argument: _cln_WaitsendpayRequest,
    callback: grpc.requestCallback<_cln_WaitsendpayResponse__Output>
  ): grpc.ClientUnaryCall

  Withdraw(
    argument: _cln_WithdrawRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  Withdraw(
    argument: _cln_WithdrawRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  Withdraw(
    argument: _cln_WithdrawRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  Withdraw(
    argument: _cln_WithdrawRequest,
    callback: grpc.requestCallback<_cln_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  withdraw(
    argument: _cln_WithdrawRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  withdraw(
    argument: _cln_WithdrawRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_cln_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  withdraw(
    argument: _cln_WithdrawRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_cln_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
  withdraw(
    argument: _cln_WithdrawRequest,
    callback: grpc.requestCallback<_cln_WithdrawResponse__Output>
  ): grpc.ClientUnaryCall
}

export interface NodeHandlers extends grpc.UntypedServiceImplementation {
  AddGossip: grpc.handleUnaryCall<
    _cln_AddgossipRequest__Output,
    _cln_AddgossipResponse
  >

  AutoCleanInvoice: grpc.handleUnaryCall<
    _cln_AutocleaninvoiceRequest__Output,
    _cln_AutocleaninvoiceResponse
  >

  CheckMessage: grpc.handleUnaryCall<
    _cln_CheckmessageRequest__Output,
    _cln_CheckmessageResponse
  >

  Close: grpc.handleUnaryCall<_cln_CloseRequest__Output, _cln_CloseResponse>

  ConnectPeer: grpc.handleUnaryCall<
    _cln_ConnectRequest__Output,
    _cln_ConnectResponse
  >

  CreateInvoice: grpc.handleUnaryCall<
    _cln_CreateinvoiceRequest__Output,
    _cln_CreateinvoiceResponse
  >

  CreateOnion: grpc.handleUnaryCall<
    _cln_CreateonionRequest__Output,
    _cln_CreateonionResponse
  >

  Datastore: grpc.handleUnaryCall<
    _cln_DatastoreRequest__Output,
    _cln_DatastoreResponse
  >

  DelDatastore: grpc.handleUnaryCall<
    _cln_DeldatastoreRequest__Output,
    _cln_DeldatastoreResponse
  >

  DelExpiredInvoice: grpc.handleUnaryCall<
    _cln_DelexpiredinvoiceRequest__Output,
    _cln_DelexpiredinvoiceResponse
  >

  DelInvoice: grpc.handleUnaryCall<
    _cln_DelinvoiceRequest__Output,
    _cln_DelinvoiceResponse
  >

  Disconnect: grpc.handleUnaryCall<
    _cln_DisconnectRequest__Output,
    _cln_DisconnectResponse
  >

  Feerates: grpc.handleUnaryCall<
    _cln_FeeratesRequest__Output,
    _cln_FeeratesResponse
  >

  FundChannel: grpc.handleUnaryCall<
    _cln_FundchannelRequest__Output,
    _cln_FundchannelResponse
  >

  FundPsbt: grpc.handleUnaryCall<
    _cln_FundpsbtRequest__Output,
    _cln_FundpsbtResponse
  >

  GetRoute: grpc.handleUnaryCall<
    _cln_GetrouteRequest__Output,
    _cln_GetrouteResponse
  >

  Getinfo: grpc.handleUnaryCall<
    _cln_GetinfoRequest__Output,
    _cln_GetinfoResponse
  >

  Invoice: grpc.handleUnaryCall<
    _cln_InvoiceRequest__Output,
    _cln_InvoiceResponse
  >

  KeySend: grpc.handleUnaryCall<
    _cln_KeysendRequest__Output,
    _cln_KeysendResponse
  >

  ListChannels: grpc.handleUnaryCall<
    _cln_ListchannelsRequest__Output,
    _cln_ListchannelsResponse
  >

  ListDatastore: grpc.handleUnaryCall<
    _cln_ListdatastoreRequest__Output,
    _cln_ListdatastoreResponse
  >

  ListForwards: grpc.handleUnaryCall<
    _cln_ListforwardsRequest__Output,
    _cln_ListforwardsResponse
  >

  ListFunds: grpc.handleUnaryCall<
    _cln_ListfundsRequest__Output,
    _cln_ListfundsResponse
  >

  ListInvoices: grpc.handleUnaryCall<
    _cln_ListinvoicesRequest__Output,
    _cln_ListinvoicesResponse
  >

  ListNodes: grpc.handleUnaryCall<
    _cln_ListnodesRequest__Output,
    _cln_ListnodesResponse
  >

  ListPays: grpc.handleUnaryCall<
    _cln_ListpaysRequest__Output,
    _cln_ListpaysResponse
  >

  ListPeers: grpc.handleUnaryCall<
    _cln_ListpeersRequest__Output,
    _cln_ListpeersResponse
  >

  ListSendPays: grpc.handleUnaryCall<
    _cln_ListsendpaysRequest__Output,
    _cln_ListsendpaysResponse
  >

  ListTransactions: grpc.handleUnaryCall<
    _cln_ListtransactionsRequest__Output,
    _cln_ListtransactionsResponse
  >

  NewAddr: grpc.handleUnaryCall<
    _cln_NewaddrRequest__Output,
    _cln_NewaddrResponse
  >

  Pay: grpc.handleUnaryCall<_cln_PayRequest__Output, _cln_PayResponse>

  Ping: grpc.handleUnaryCall<_cln_PingRequest__Output, _cln_PingResponse>

  SendCustomMsg: grpc.handleUnaryCall<
    _cln_SendcustommsgRequest__Output,
    _cln_SendcustommsgResponse
  >

  SendOnion: grpc.handleUnaryCall<
    _cln_SendonionRequest__Output,
    _cln_SendonionResponse
  >

  SendPay: grpc.handleUnaryCall<
    _cln_SendpayRequest__Output,
    _cln_SendpayResponse
  >

  SendPsbt: grpc.handleUnaryCall<
    _cln_SendpsbtRequest__Output,
    _cln_SendpsbtResponse
  >

  SetChannel: grpc.handleUnaryCall<
    _cln_SetchannelRequest__Output,
    _cln_SetchannelResponse
  >

  SignInvoice: grpc.handleUnaryCall<
    _cln_SigninvoiceRequest__Output,
    _cln_SigninvoiceResponse
  >

  SignMessage: grpc.handleUnaryCall<
    _cln_SignmessageRequest__Output,
    _cln_SignmessageResponse
  >

  SignPsbt: grpc.handleUnaryCall<
    _cln_SignpsbtRequest__Output,
    _cln_SignpsbtResponse
  >

  Stop: grpc.handleUnaryCall<_cln_StopRequest__Output, _cln_StopResponse>

  TxDiscard: grpc.handleUnaryCall<
    _cln_TxdiscardRequest__Output,
    _cln_TxdiscardResponse
  >

  TxPrepare: grpc.handleUnaryCall<
    _cln_TxprepareRequest__Output,
    _cln_TxprepareResponse
  >

  TxSend: grpc.handleUnaryCall<_cln_TxsendRequest__Output, _cln_TxsendResponse>

  UtxoPsbt: grpc.handleUnaryCall<
    _cln_UtxopsbtRequest__Output,
    _cln_UtxopsbtResponse
  >

  WaitAnyInvoice: grpc.handleUnaryCall<
    _cln_WaitanyinvoiceRequest__Output,
    _cln_WaitanyinvoiceResponse
  >

  WaitInvoice: grpc.handleUnaryCall<
    _cln_WaitinvoiceRequest__Output,
    _cln_WaitinvoiceResponse
  >

  WaitSendPay: grpc.handleUnaryCall<
    _cln_WaitsendpayRequest__Output,
    _cln_WaitsendpayResponse
  >

  Withdraw: grpc.handleUnaryCall<
    _cln_WithdrawRequest__Output,
    _cln_WithdrawResponse
  >
}

export interface NodeDefinition extends grpc.ServiceDefinition {
  AddGossip: MethodDefinition<
    _cln_AddgossipRequest,
    _cln_AddgossipResponse,
    _cln_AddgossipRequest__Output,
    _cln_AddgossipResponse__Output
  >
  AutoCleanInvoice: MethodDefinition<
    _cln_AutocleaninvoiceRequest,
    _cln_AutocleaninvoiceResponse,
    _cln_AutocleaninvoiceRequest__Output,
    _cln_AutocleaninvoiceResponse__Output
  >
  CheckMessage: MethodDefinition<
    _cln_CheckmessageRequest,
    _cln_CheckmessageResponse,
    _cln_CheckmessageRequest__Output,
    _cln_CheckmessageResponse__Output
  >
  Close: MethodDefinition<
    _cln_CloseRequest,
    _cln_CloseResponse,
    _cln_CloseRequest__Output,
    _cln_CloseResponse__Output
  >
  ConnectPeer: MethodDefinition<
    _cln_ConnectRequest,
    _cln_ConnectResponse,
    _cln_ConnectRequest__Output,
    _cln_ConnectResponse__Output
  >
  CreateInvoice: MethodDefinition<
    _cln_CreateinvoiceRequest,
    _cln_CreateinvoiceResponse,
    _cln_CreateinvoiceRequest__Output,
    _cln_CreateinvoiceResponse__Output
  >
  CreateOnion: MethodDefinition<
    _cln_CreateonionRequest,
    _cln_CreateonionResponse,
    _cln_CreateonionRequest__Output,
    _cln_CreateonionResponse__Output
  >
  Datastore: MethodDefinition<
    _cln_DatastoreRequest,
    _cln_DatastoreResponse,
    _cln_DatastoreRequest__Output,
    _cln_DatastoreResponse__Output
  >
  DelDatastore: MethodDefinition<
    _cln_DeldatastoreRequest,
    _cln_DeldatastoreResponse,
    _cln_DeldatastoreRequest__Output,
    _cln_DeldatastoreResponse__Output
  >
  DelExpiredInvoice: MethodDefinition<
    _cln_DelexpiredinvoiceRequest,
    _cln_DelexpiredinvoiceResponse,
    _cln_DelexpiredinvoiceRequest__Output,
    _cln_DelexpiredinvoiceResponse__Output
  >
  DelInvoice: MethodDefinition<
    _cln_DelinvoiceRequest,
    _cln_DelinvoiceResponse,
    _cln_DelinvoiceRequest__Output,
    _cln_DelinvoiceResponse__Output
  >
  Disconnect: MethodDefinition<
    _cln_DisconnectRequest,
    _cln_DisconnectResponse,
    _cln_DisconnectRequest__Output,
    _cln_DisconnectResponse__Output
  >
  Feerates: MethodDefinition<
    _cln_FeeratesRequest,
    _cln_FeeratesResponse,
    _cln_FeeratesRequest__Output,
    _cln_FeeratesResponse__Output
  >
  FundChannel: MethodDefinition<
    _cln_FundchannelRequest,
    _cln_FundchannelResponse,
    _cln_FundchannelRequest__Output,
    _cln_FundchannelResponse__Output
  >
  FundPsbt: MethodDefinition<
    _cln_FundpsbtRequest,
    _cln_FundpsbtResponse,
    _cln_FundpsbtRequest__Output,
    _cln_FundpsbtResponse__Output
  >
  GetRoute: MethodDefinition<
    _cln_GetrouteRequest,
    _cln_GetrouteResponse,
    _cln_GetrouteRequest__Output,
    _cln_GetrouteResponse__Output
  >
  Getinfo: MethodDefinition<
    _cln_GetinfoRequest,
    _cln_GetinfoResponse,
    _cln_GetinfoRequest__Output,
    _cln_GetinfoResponse__Output
  >
  Invoice: MethodDefinition<
    _cln_InvoiceRequest,
    _cln_InvoiceResponse,
    _cln_InvoiceRequest__Output,
    _cln_InvoiceResponse__Output
  >
  KeySend: MethodDefinition<
    _cln_KeysendRequest,
    _cln_KeysendResponse,
    _cln_KeysendRequest__Output,
    _cln_KeysendResponse__Output
  >
  ListChannels: MethodDefinition<
    _cln_ListchannelsRequest,
    _cln_ListchannelsResponse,
    _cln_ListchannelsRequest__Output,
    _cln_ListchannelsResponse__Output
  >
  ListDatastore: MethodDefinition<
    _cln_ListdatastoreRequest,
    _cln_ListdatastoreResponse,
    _cln_ListdatastoreRequest__Output,
    _cln_ListdatastoreResponse__Output
  >
  ListForwards: MethodDefinition<
    _cln_ListforwardsRequest,
    _cln_ListforwardsResponse,
    _cln_ListforwardsRequest__Output,
    _cln_ListforwardsResponse__Output
  >
  ListFunds: MethodDefinition<
    _cln_ListfundsRequest,
    _cln_ListfundsResponse,
    _cln_ListfundsRequest__Output,
    _cln_ListfundsResponse__Output
  >
  ListInvoices: MethodDefinition<
    _cln_ListinvoicesRequest,
    _cln_ListinvoicesResponse,
    _cln_ListinvoicesRequest__Output,
    _cln_ListinvoicesResponse__Output
  >
  ListNodes: MethodDefinition<
    _cln_ListnodesRequest,
    _cln_ListnodesResponse,
    _cln_ListnodesRequest__Output,
    _cln_ListnodesResponse__Output
  >
  ListPays: MethodDefinition<
    _cln_ListpaysRequest,
    _cln_ListpaysResponse,
    _cln_ListpaysRequest__Output,
    _cln_ListpaysResponse__Output
  >
  ListPeers: MethodDefinition<
    _cln_ListpeersRequest,
    _cln_ListpeersResponse,
    _cln_ListpeersRequest__Output,
    _cln_ListpeersResponse__Output
  >
  ListSendPays: MethodDefinition<
    _cln_ListsendpaysRequest,
    _cln_ListsendpaysResponse,
    _cln_ListsendpaysRequest__Output,
    _cln_ListsendpaysResponse__Output
  >
  ListTransactions: MethodDefinition<
    _cln_ListtransactionsRequest,
    _cln_ListtransactionsResponse,
    _cln_ListtransactionsRequest__Output,
    _cln_ListtransactionsResponse__Output
  >
  NewAddr: MethodDefinition<
    _cln_NewaddrRequest,
    _cln_NewaddrResponse,
    _cln_NewaddrRequest__Output,
    _cln_NewaddrResponse__Output
  >
  Pay: MethodDefinition<
    _cln_PayRequest,
    _cln_PayResponse,
    _cln_PayRequest__Output,
    _cln_PayResponse__Output
  >
  Ping: MethodDefinition<
    _cln_PingRequest,
    _cln_PingResponse,
    _cln_PingRequest__Output,
    _cln_PingResponse__Output
  >
  SendCustomMsg: MethodDefinition<
    _cln_SendcustommsgRequest,
    _cln_SendcustommsgResponse,
    _cln_SendcustommsgRequest__Output,
    _cln_SendcustommsgResponse__Output
  >
  SendOnion: MethodDefinition<
    _cln_SendonionRequest,
    _cln_SendonionResponse,
    _cln_SendonionRequest__Output,
    _cln_SendonionResponse__Output
  >
  SendPay: MethodDefinition<
    _cln_SendpayRequest,
    _cln_SendpayResponse,
    _cln_SendpayRequest__Output,
    _cln_SendpayResponse__Output
  >
  SendPsbt: MethodDefinition<
    _cln_SendpsbtRequest,
    _cln_SendpsbtResponse,
    _cln_SendpsbtRequest__Output,
    _cln_SendpsbtResponse__Output
  >
  SetChannel: MethodDefinition<
    _cln_SetchannelRequest,
    _cln_SetchannelResponse,
    _cln_SetchannelRequest__Output,
    _cln_SetchannelResponse__Output
  >
  SignInvoice: MethodDefinition<
    _cln_SigninvoiceRequest,
    _cln_SigninvoiceResponse,
    _cln_SigninvoiceRequest__Output,
    _cln_SigninvoiceResponse__Output
  >
  SignMessage: MethodDefinition<
    _cln_SignmessageRequest,
    _cln_SignmessageResponse,
    _cln_SignmessageRequest__Output,
    _cln_SignmessageResponse__Output
  >
  SignPsbt: MethodDefinition<
    _cln_SignpsbtRequest,
    _cln_SignpsbtResponse,
    _cln_SignpsbtRequest__Output,
    _cln_SignpsbtResponse__Output
  >
  Stop: MethodDefinition<
    _cln_StopRequest,
    _cln_StopResponse,
    _cln_StopRequest__Output,
    _cln_StopResponse__Output
  >
  TxDiscard: MethodDefinition<
    _cln_TxdiscardRequest,
    _cln_TxdiscardResponse,
    _cln_TxdiscardRequest__Output,
    _cln_TxdiscardResponse__Output
  >
  TxPrepare: MethodDefinition<
    _cln_TxprepareRequest,
    _cln_TxprepareResponse,
    _cln_TxprepareRequest__Output,
    _cln_TxprepareResponse__Output
  >
  TxSend: MethodDefinition<
    _cln_TxsendRequest,
    _cln_TxsendResponse,
    _cln_TxsendRequest__Output,
    _cln_TxsendResponse__Output
  >
  UtxoPsbt: MethodDefinition<
    _cln_UtxopsbtRequest,
    _cln_UtxopsbtResponse,
    _cln_UtxopsbtRequest__Output,
    _cln_UtxopsbtResponse__Output
  >
  WaitAnyInvoice: MethodDefinition<
    _cln_WaitanyinvoiceRequest,
    _cln_WaitanyinvoiceResponse,
    _cln_WaitanyinvoiceRequest__Output,
    _cln_WaitanyinvoiceResponse__Output
  >
  WaitInvoice: MethodDefinition<
    _cln_WaitinvoiceRequest,
    _cln_WaitinvoiceResponse,
    _cln_WaitinvoiceRequest__Output,
    _cln_WaitinvoiceResponse__Output
  >
  WaitSendPay: MethodDefinition<
    _cln_WaitsendpayRequest,
    _cln_WaitsendpayResponse,
    _cln_WaitsendpayRequest__Output,
    _cln_WaitsendpayResponse__Output
  >
  Withdraw: MethodDefinition<
    _cln_WithdrawRequest,
    _cln_WithdrawResponse,
    _cln_WithdrawRequest__Output,
    _cln_WithdrawResponse__Output
  >
}
