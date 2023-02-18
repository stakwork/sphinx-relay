import type * as grpc from '@grpc/grpc-js'
import type {
  EnumTypeDefinition,
  MessageTypeDefinition,
} from '@grpc/proto-loader'

import type {
  LightningClient as _lnrpc_LightningClient,
  LightningDefinition as _lnrpc_LightningDefinition,
} from './lnrpc/Lightning'
import type {
  RouterClient as _routerrpc_RouterClient,
  RouterDefinition as _routerrpc_RouterDefinition,
} from './routerrpc/Router'

type SubtypeConstructor<
  Constructor extends new (...args: unknown[]) => unknown,
  Subtype
> = {
  new (...args: ConstructorParameters<Constructor>): Subtype
}

export interface ProtoGrpcType {
  lnrpc: {
    AMP: MessageTypeDefinition
    AMPInvoiceState: MessageTypeDefinition
    AMPRecord: MessageTypeDefinition
    AbandonChannelRequest: MessageTypeDefinition
    AbandonChannelResponse: MessageTypeDefinition
    AddInvoiceResponse: MessageTypeDefinition
    AddressType: EnumTypeDefinition
    AliasMap: MessageTypeDefinition
    Amount: MessageTypeDefinition
    BakeMacaroonRequest: MessageTypeDefinition
    BakeMacaroonResponse: MessageTypeDefinition
    BatchOpenChannel: MessageTypeDefinition
    BatchOpenChannelRequest: MessageTypeDefinition
    BatchOpenChannelResponse: MessageTypeDefinition
    Chain: MessageTypeDefinition
    ChanBackupExportRequest: MessageTypeDefinition
    ChanBackupSnapshot: MessageTypeDefinition
    ChanInfoRequest: MessageTypeDefinition
    ChanPointShim: MessageTypeDefinition
    Channel: MessageTypeDefinition
    ChannelAcceptRequest: MessageTypeDefinition
    ChannelAcceptResponse: MessageTypeDefinition
    ChannelBackup: MessageTypeDefinition
    ChannelBackupSubscription: MessageTypeDefinition
    ChannelBackups: MessageTypeDefinition
    ChannelBalanceRequest: MessageTypeDefinition
    ChannelBalanceResponse: MessageTypeDefinition
    ChannelCloseSummary: MessageTypeDefinition
    ChannelCloseUpdate: MessageTypeDefinition
    ChannelConstraints: MessageTypeDefinition
    ChannelEdge: MessageTypeDefinition
    ChannelEdgeUpdate: MessageTypeDefinition
    ChannelEventSubscription: MessageTypeDefinition
    ChannelEventUpdate: MessageTypeDefinition
    ChannelFeeReport: MessageTypeDefinition
    ChannelGraph: MessageTypeDefinition
    ChannelGraphRequest: MessageTypeDefinition
    ChannelOpenUpdate: MessageTypeDefinition
    ChannelPoint: MessageTypeDefinition
    ChannelUpdate: MessageTypeDefinition
    CheckMacPermRequest: MessageTypeDefinition
    CheckMacPermResponse: MessageTypeDefinition
    CloseChannelRequest: MessageTypeDefinition
    CloseStatusUpdate: MessageTypeDefinition
    ClosedChannelUpdate: MessageTypeDefinition
    ClosedChannelsRequest: MessageTypeDefinition
    ClosedChannelsResponse: MessageTypeDefinition
    CommitmentType: EnumTypeDefinition
    ConfirmationUpdate: MessageTypeDefinition
    ConnectPeerRequest: MessageTypeDefinition
    ConnectPeerResponse: MessageTypeDefinition
    CustomMessage: MessageTypeDefinition
    DebugLevelRequest: MessageTypeDefinition
    DebugLevelResponse: MessageTypeDefinition
    DeleteAllPaymentsRequest: MessageTypeDefinition
    DeleteAllPaymentsResponse: MessageTypeDefinition
    DeleteMacaroonIDRequest: MessageTypeDefinition
    DeleteMacaroonIDResponse: MessageTypeDefinition
    DeletePaymentRequest: MessageTypeDefinition
    DeletePaymentResponse: MessageTypeDefinition
    DisconnectPeerRequest: MessageTypeDefinition
    DisconnectPeerResponse: MessageTypeDefinition
    EdgeLocator: MessageTypeDefinition
    EstimateFeeRequest: MessageTypeDefinition
    EstimateFeeResponse: MessageTypeDefinition
    ExportChannelBackupRequest: MessageTypeDefinition
    FailedUpdate: MessageTypeDefinition
    Failure: MessageTypeDefinition
    Feature: MessageTypeDefinition
    FeatureBit: EnumTypeDefinition
    FeeLimit: MessageTypeDefinition
    FeeReportRequest: MessageTypeDefinition
    FeeReportResponse: MessageTypeDefinition
    FloatMetric: MessageTypeDefinition
    ForwardingEvent: MessageTypeDefinition
    ForwardingHistoryRequest: MessageTypeDefinition
    ForwardingHistoryResponse: MessageTypeDefinition
    FundingPsbtFinalize: MessageTypeDefinition
    FundingPsbtVerify: MessageTypeDefinition
    FundingShim: MessageTypeDefinition
    FundingShimCancel: MessageTypeDefinition
    FundingStateStepResp: MessageTypeDefinition
    FundingTransitionMsg: MessageTypeDefinition
    GetInfoRequest: MessageTypeDefinition
    GetInfoResponse: MessageTypeDefinition
    GetRecoveryInfoRequest: MessageTypeDefinition
    GetRecoveryInfoResponse: MessageTypeDefinition
    GetTransactionsRequest: MessageTypeDefinition
    GraphTopologySubscription: MessageTypeDefinition
    GraphTopologyUpdate: MessageTypeDefinition
    HTLC: MessageTypeDefinition
    HTLCAttempt: MessageTypeDefinition
    Hop: MessageTypeDefinition
    HopHint: MessageTypeDefinition
    Initiator: EnumTypeDefinition
    InterceptFeedback: MessageTypeDefinition
    Invoice: MessageTypeDefinition
    InvoiceHTLC: MessageTypeDefinition
    InvoiceHTLCState: EnumTypeDefinition
    InvoiceSubscription: MessageTypeDefinition
    KeyDescriptor: MessageTypeDefinition
    KeyLocator: MessageTypeDefinition
    Lightning: SubtypeConstructor<
      typeof grpc.Client,
      _lnrpc_LightningClient
    > & { service: _lnrpc_LightningDefinition }
    LightningAddress: MessageTypeDefinition
    LightningNode: MessageTypeDefinition
    ListAliasesRequest: MessageTypeDefinition
    ListAliasesResponse: MessageTypeDefinition
    ListChannelsRequest: MessageTypeDefinition
    ListChannelsResponse: MessageTypeDefinition
    ListInvoiceRequest: MessageTypeDefinition
    ListInvoiceResponse: MessageTypeDefinition
    ListMacaroonIDsRequest: MessageTypeDefinition
    ListMacaroonIDsResponse: MessageTypeDefinition
    ListPaymentsRequest: MessageTypeDefinition
    ListPaymentsResponse: MessageTypeDefinition
    ListPeersRequest: MessageTypeDefinition
    ListPeersResponse: MessageTypeDefinition
    ListPermissionsRequest: MessageTypeDefinition
    ListPermissionsResponse: MessageTypeDefinition
    ListUnspentRequest: MessageTypeDefinition
    ListUnspentResponse: MessageTypeDefinition
    LookupHtlcRequest: MessageTypeDefinition
    LookupHtlcResponse: MessageTypeDefinition
    MPPRecord: MessageTypeDefinition
    MacaroonId: MessageTypeDefinition
    MacaroonPermission: MessageTypeDefinition
    MacaroonPermissionList: MessageTypeDefinition
    MiddlewareRegistration: MessageTypeDefinition
    MultiChanBackup: MessageTypeDefinition
    NetworkInfo: MessageTypeDefinition
    NetworkInfoRequest: MessageTypeDefinition
    NewAddressRequest: MessageTypeDefinition
    NewAddressResponse: MessageTypeDefinition
    NodeAddress: MessageTypeDefinition
    NodeInfo: MessageTypeDefinition
    NodeInfoRequest: MessageTypeDefinition
    NodeMetricType: EnumTypeDefinition
    NodeMetricsRequest: MessageTypeDefinition
    NodeMetricsResponse: MessageTypeDefinition
    NodePair: MessageTypeDefinition
    NodeUpdate: MessageTypeDefinition
    Op: MessageTypeDefinition
    OpenChannelRequest: MessageTypeDefinition
    OpenStatusUpdate: MessageTypeDefinition
    OutPoint: MessageTypeDefinition
    OutputDetail: MessageTypeDefinition
    OutputScriptType: EnumTypeDefinition
    PayReq: MessageTypeDefinition
    PayReqString: MessageTypeDefinition
    Payment: MessageTypeDefinition
    PaymentFailureReason: EnumTypeDefinition
    PaymentHash: MessageTypeDefinition
    Peer: MessageTypeDefinition
    PeerEvent: MessageTypeDefinition
    PeerEventSubscription: MessageTypeDefinition
    PendingChannelsRequest: MessageTypeDefinition
    PendingChannelsResponse: MessageTypeDefinition
    PendingHTLC: MessageTypeDefinition
    PendingUpdate: MessageTypeDefinition
    PolicyUpdateRequest: MessageTypeDefinition
    PolicyUpdateResponse: MessageTypeDefinition
    PreviousOutPoint: MessageTypeDefinition
    PsbtShim: MessageTypeDefinition
    QueryRoutesRequest: MessageTypeDefinition
    QueryRoutesResponse: MessageTypeDefinition
    RPCMessage: MessageTypeDefinition
    RPCMiddlewareRequest: MessageTypeDefinition
    RPCMiddlewareResponse: MessageTypeDefinition
    ReadyForPsbtFunding: MessageTypeDefinition
    Resolution: MessageTypeDefinition
    ResolutionOutcome: EnumTypeDefinition
    ResolutionType: EnumTypeDefinition
    RestoreBackupResponse: MessageTypeDefinition
    RestoreChanBackupRequest: MessageTypeDefinition
    Route: MessageTypeDefinition
    RouteHint: MessageTypeDefinition
    RoutingPolicy: MessageTypeDefinition
    SendCoinsRequest: MessageTypeDefinition
    SendCoinsResponse: MessageTypeDefinition
    SendCustomMessageRequest: MessageTypeDefinition
    SendCustomMessageResponse: MessageTypeDefinition
    SendManyRequest: MessageTypeDefinition
    SendManyResponse: MessageTypeDefinition
    SendRequest: MessageTypeDefinition
    SendResponse: MessageTypeDefinition
    SendToRouteRequest: MessageTypeDefinition
    SetID: MessageTypeDefinition
    SignMessageRequest: MessageTypeDefinition
    SignMessageResponse: MessageTypeDefinition
    StopRequest: MessageTypeDefinition
    StopResponse: MessageTypeDefinition
    StreamAuth: MessageTypeDefinition
    SubscribeCustomMessagesRequest: MessageTypeDefinition
    TimestampedError: MessageTypeDefinition
    Transaction: MessageTypeDefinition
    TransactionDetails: MessageTypeDefinition
    UpdateFailure: EnumTypeDefinition
    Utxo: MessageTypeDefinition
    VerifyChanBackupResponse: MessageTypeDefinition
    VerifyMessageRequest: MessageTypeDefinition
    VerifyMessageResponse: MessageTypeDefinition
    WalletAccountBalance: MessageTypeDefinition
    WalletBalanceRequest: MessageTypeDefinition
    WalletBalanceResponse: MessageTypeDefinition
  }
  routerrpc: {
    BuildRouteRequest: MessageTypeDefinition
    BuildRouteResponse: MessageTypeDefinition
    ChanStatusAction: EnumTypeDefinition
    CircuitKey: MessageTypeDefinition
    FailureDetail: EnumTypeDefinition
    FinalHtlcEvent: MessageTypeDefinition
    ForwardEvent: MessageTypeDefinition
    ForwardFailEvent: MessageTypeDefinition
    ForwardHtlcInterceptRequest: MessageTypeDefinition
    ForwardHtlcInterceptResponse: MessageTypeDefinition
    GetMissionControlConfigRequest: MessageTypeDefinition
    GetMissionControlConfigResponse: MessageTypeDefinition
    HtlcEvent: MessageTypeDefinition
    HtlcInfo: MessageTypeDefinition
    LinkFailEvent: MessageTypeDefinition
    MissionControlConfig: MessageTypeDefinition
    PairData: MessageTypeDefinition
    PairHistory: MessageTypeDefinition
    PaymentState: EnumTypeDefinition
    PaymentStatus: MessageTypeDefinition
    QueryMissionControlRequest: MessageTypeDefinition
    QueryMissionControlResponse: MessageTypeDefinition
    QueryProbabilityRequest: MessageTypeDefinition
    QueryProbabilityResponse: MessageTypeDefinition
    ResetMissionControlRequest: MessageTypeDefinition
    ResetMissionControlResponse: MessageTypeDefinition
    ResolveHoldForwardAction: EnumTypeDefinition
    RouteFeeRequest: MessageTypeDefinition
    RouteFeeResponse: MessageTypeDefinition
    Router: SubtypeConstructor<typeof grpc.Client, _routerrpc_RouterClient> & {
      service: _routerrpc_RouterDefinition
    }
    SendPaymentRequest: MessageTypeDefinition
    SendToRouteRequest: MessageTypeDefinition
    SendToRouteResponse: MessageTypeDefinition
    SetMissionControlConfigRequest: MessageTypeDefinition
    SetMissionControlConfigResponse: MessageTypeDefinition
    SettleEvent: MessageTypeDefinition
    SubscribeHtlcEventsRequest: MessageTypeDefinition
    SubscribedEvent: MessageTypeDefinition
    TrackPaymentRequest: MessageTypeDefinition
    TrackPaymentsRequest: MessageTypeDefinition
    UpdateChanStatusRequest: MessageTypeDefinition
    UpdateChanStatusResponse: MessageTypeDefinition
    XImportMissionControlRequest: MessageTypeDefinition
    XImportMissionControlResponse: MessageTypeDefinition
  }
}
