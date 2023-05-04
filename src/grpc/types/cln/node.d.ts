import type * as grpc from '@grpc/grpc-js'
import type {
  EnumTypeDefinition,
  MessageTypeDefinition,
} from '@grpc/proto-loader'

import type {
  NodeClient as _cln_NodeClient,
  NodeDefinition as _cln_NodeDefinition,
} from './cln/Node'

type SubtypeConstructor<
  Constructor extends new (...args: unknown[]) => unknown,
  Subtype
> = {
  new (...args: ConstructorParameters<Constructor>): Subtype
}

export interface ProtoGrpcType {
  cln: {
    AddgossipRequest: MessageTypeDefinition
    AddgossipResponse: MessageTypeDefinition
    Amount: MessageTypeDefinition
    AmountOrAll: MessageTypeDefinition
    AmountOrAny: MessageTypeDefinition
    AutocleaninvoiceRequest: MessageTypeDefinition
    AutocleaninvoiceResponse: MessageTypeDefinition
    ChannelSide: EnumTypeDefinition
    ChannelState: EnumTypeDefinition
    ChannelStateChangeCause: MessageTypeDefinition
    CheckmessageRequest: MessageTypeDefinition
    CheckmessageResponse: MessageTypeDefinition
    CloseRequest: MessageTypeDefinition
    CloseResponse: MessageTypeDefinition
    ConnectAddress: MessageTypeDefinition
    ConnectRequest: MessageTypeDefinition
    ConnectResponse: MessageTypeDefinition
    CreateinvoiceRequest: MessageTypeDefinition
    CreateinvoiceResponse: MessageTypeDefinition
    CreateonionHops: MessageTypeDefinition
    CreateonionRequest: MessageTypeDefinition
    CreateonionResponse: MessageTypeDefinition
    DatastoreRequest: MessageTypeDefinition
    DatastoreResponse: MessageTypeDefinition
    DeldatastoreRequest: MessageTypeDefinition
    DeldatastoreResponse: MessageTypeDefinition
    DelexpiredinvoiceRequest: MessageTypeDefinition
    DelexpiredinvoiceResponse: MessageTypeDefinition
    DelinvoiceRequest: MessageTypeDefinition
    DelinvoiceResponse: MessageTypeDefinition
    DisconnectRequest: MessageTypeDefinition
    DisconnectResponse: MessageTypeDefinition
    Feerate: MessageTypeDefinition
    FeeratesOnchain_fee_estimates: MessageTypeDefinition
    FeeratesPerkb: MessageTypeDefinition
    FeeratesPerkbEstimates: MessageTypeDefinition
    FeeratesPerkw: MessageTypeDefinition
    FeeratesPerkwEstimates: MessageTypeDefinition
    FeeratesRequest: MessageTypeDefinition
    FeeratesResponse: MessageTypeDefinition
    FundchannelRequest: MessageTypeDefinition
    FundchannelResponse: MessageTypeDefinition
    FundpsbtRequest: MessageTypeDefinition
    FundpsbtReservations: MessageTypeDefinition
    FundpsbtResponse: MessageTypeDefinition
    GetinfoAddress: MessageTypeDefinition
    GetinfoBinding: MessageTypeDefinition
    GetinfoOur_features: MessageTypeDefinition
    GetinfoRequest: MessageTypeDefinition
    GetinfoResponse: MessageTypeDefinition
    GetrouteRequest: MessageTypeDefinition
    GetrouteResponse: MessageTypeDefinition
    GetrouteRoute: MessageTypeDefinition
    InvoiceRequest: MessageTypeDefinition
    InvoiceResponse: MessageTypeDefinition
    KeysendRequest: MessageTypeDefinition
    KeysendResponse: MessageTypeDefinition
    ListchannelsChannels: MessageTypeDefinition
    ListchannelsRequest: MessageTypeDefinition
    ListchannelsResponse: MessageTypeDefinition
    ListdatastoreDatastore: MessageTypeDefinition
    ListdatastoreRequest: MessageTypeDefinition
    ListdatastoreResponse: MessageTypeDefinition
    ListforwardsForwards: MessageTypeDefinition
    ListforwardsRequest: MessageTypeDefinition
    ListforwardsResponse: MessageTypeDefinition
    ListfundsChannels: MessageTypeDefinition
    ListfundsOutputs: MessageTypeDefinition
    ListfundsRequest: MessageTypeDefinition
    ListfundsResponse: MessageTypeDefinition
    ListinvoicesInvoices: MessageTypeDefinition
    ListinvoicesRequest: MessageTypeDefinition
    ListinvoicesResponse: MessageTypeDefinition
    ListnodesNodes: MessageTypeDefinition
    ListnodesNodesAddresses: MessageTypeDefinition
    ListnodesRequest: MessageTypeDefinition
    ListnodesResponse: MessageTypeDefinition
    ListpaysPays: MessageTypeDefinition
    ListpaysRequest: MessageTypeDefinition
    ListpaysResponse: MessageTypeDefinition
    ListpeersPeers: MessageTypeDefinition
    ListpeersPeersChannels: MessageTypeDefinition
    ListpeersPeersChannelsAlias: MessageTypeDefinition
    ListpeersPeersChannelsFeerate: MessageTypeDefinition
    ListpeersPeersChannelsFunding: MessageTypeDefinition
    ListpeersPeersChannelsHtlcs: MessageTypeDefinition
    ListpeersPeersChannelsInflight: MessageTypeDefinition
    ListpeersPeersLog: MessageTypeDefinition
    ListpeersRequest: MessageTypeDefinition
    ListpeersResponse: MessageTypeDefinition
    ListsendpaysPayments: MessageTypeDefinition
    ListsendpaysRequest: MessageTypeDefinition
    ListsendpaysResponse: MessageTypeDefinition
    ListtransactionsRequest: MessageTypeDefinition
    ListtransactionsResponse: MessageTypeDefinition
    ListtransactionsTransactions: MessageTypeDefinition
    ListtransactionsTransactionsInputs: MessageTypeDefinition
    ListtransactionsTransactionsOutputs: MessageTypeDefinition
    NewaddrRequest: MessageTypeDefinition
    NewaddrResponse: MessageTypeDefinition
    Node: SubtypeConstructor<typeof grpc.Client, _cln_NodeClient> & {
      service: _cln_NodeDefinition
    }
    Outpoint: MessageTypeDefinition
    OutputDesc: MessageTypeDefinition
    PayRequest: MessageTypeDefinition
    PayResponse: MessageTypeDefinition
    PingRequest: MessageTypeDefinition
    PingResponse: MessageTypeDefinition
    RouteHop: MessageTypeDefinition
    Routehint: MessageTypeDefinition
    RoutehintList: MessageTypeDefinition
    SendcustommsgRequest: MessageTypeDefinition
    SendcustommsgResponse: MessageTypeDefinition
    SendonionFirst_hop: MessageTypeDefinition
    SendonionRequest: MessageTypeDefinition
    SendonionResponse: MessageTypeDefinition
    SendpayRequest: MessageTypeDefinition
    SendpayResponse: MessageTypeDefinition
    SendpayRoute: MessageTypeDefinition
    SendpsbtRequest: MessageTypeDefinition
    SendpsbtResponse: MessageTypeDefinition
    SetchannelChannels: MessageTypeDefinition
    SetchannelRequest: MessageTypeDefinition
    SetchannelResponse: MessageTypeDefinition
    SigninvoiceRequest: MessageTypeDefinition
    SigninvoiceResponse: MessageTypeDefinition
    SignmessageRequest: MessageTypeDefinition
    SignmessageResponse: MessageTypeDefinition
    SignpsbtRequest: MessageTypeDefinition
    SignpsbtResponse: MessageTypeDefinition
    StopRequest: MessageTypeDefinition
    StopResponse: MessageTypeDefinition
    TlvEntry: MessageTypeDefinition
    TlvStream: MessageTypeDefinition
    TxdiscardRequest: MessageTypeDefinition
    TxdiscardResponse: MessageTypeDefinition
    TxprepareRequest: MessageTypeDefinition
    TxprepareResponse: MessageTypeDefinition
    TxsendRequest: MessageTypeDefinition
    TxsendResponse: MessageTypeDefinition
    UtxopsbtRequest: MessageTypeDefinition
    UtxopsbtReservations: MessageTypeDefinition
    UtxopsbtResponse: MessageTypeDefinition
    WaitanyinvoiceRequest: MessageTypeDefinition
    WaitanyinvoiceResponse: MessageTypeDefinition
    WaitinvoiceRequest: MessageTypeDefinition
    WaitinvoiceResponse: MessageTypeDefinition
    WaitsendpayRequest: MessageTypeDefinition
    WaitsendpayResponse: MessageTypeDefinition
    WithdrawRequest: MessageTypeDefinition
    WithdrawResponse: MessageTypeDefinition
  }
}
