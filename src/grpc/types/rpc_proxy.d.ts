import type * as grpc from '@grpc/grpc-js'
import type {
  EnumTypeDefinition,
  MessageTypeDefinition,
} from '@grpc/proto-loader'

import type {
  LightningClient as _lnrpc_proxy_LightningClient,
  LightningDefinition as _lnrpc_proxy_LightningDefinition,
} from './lnrpc_proxy/Lightning'

type SubtypeConstructor<
  Constructor extends new (...args: unknown[]) => unknown,
  Subtype
> = {
  new (...args: ConstructorParameters<Constructor>): Subtype
}

export interface ProtoGrpcType {
  lnrpc_proxy: {
    AddInvoiceResponse: MessageTypeDefinition
    Amount: MessageTypeDefinition
    Chain: MessageTypeDefinition
    ChanInfoRequest: MessageTypeDefinition
    Channel: MessageTypeDefinition
    ChannelBalanceRequest: MessageTypeDefinition
    ChannelBalanceResponse: MessageTypeDefinition
    ChannelConstraints: MessageTypeDefinition
    ChannelEdge: MessageTypeDefinition
    ChannelUpdate: MessageTypeDefinition
    CommitmentType: EnumTypeDefinition
    EdgeLocator: MessageTypeDefinition
    Failure: MessageTypeDefinition
    Feature: MessageTypeDefinition
    FeatureBit: EnumTypeDefinition
    FeeLimit: MessageTypeDefinition
    GetInfoRequest: MessageTypeDefinition
    GetInfoResponse: MessageTypeDefinition
    HTLC: MessageTypeDefinition
    HTLCAttempt: MessageTypeDefinition
    Hop: MessageTypeDefinition
    HopHint: MessageTypeDefinition
    Invoice: MessageTypeDefinition
    InvoiceHTLC: MessageTypeDefinition
    InvoiceHTLCState: EnumTypeDefinition
    InvoiceSubscription: MessageTypeDefinition
    Lightning: SubtypeConstructor<
      typeof grpc.Client,
      _lnrpc_proxy_LightningClient
    > & { service: _lnrpc_proxy_LightningDefinition }
    LightningAddress: MessageTypeDefinition
    ListChannelsRequest: MessageTypeDefinition
    ListChannelsResponse: MessageTypeDefinition
    MPPRecord: MessageTypeDefinition
    NodePair: MessageTypeDefinition
    PayReq: MessageTypeDefinition
    PayReqString: MessageTypeDefinition
    Payment: MessageTypeDefinition
    PaymentFailureReason: EnumTypeDefinition
    PaymentHash: MessageTypeDefinition
    QueryRoutesRequest: MessageTypeDefinition
    QueryRoutesResponse: MessageTypeDefinition
    Route: MessageTypeDefinition
    RouteHint: MessageTypeDefinition
    RoutingPolicy: MessageTypeDefinition
    SendRequest: MessageTypeDefinition
    SendResponse: MessageTypeDefinition
    SignMessageRequest: MessageTypeDefinition
    SignMessageResponse: MessageTypeDefinition
    VerifyMessageRequest: MessageTypeDefinition
    VerifyMessageResponse: MessageTypeDefinition
  }
}
