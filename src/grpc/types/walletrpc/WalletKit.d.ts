// Original file: proto/walletkit.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type {
  AddrRequest as _walletrpc_AddrRequest,
  AddrRequest__Output as _walletrpc_AddrRequest__Output,
} from '../walletrpc/AddrRequest'
import type {
  AddrResponse as _walletrpc_AddrResponse,
  AddrResponse__Output as _walletrpc_AddrResponse__Output,
} from '../walletrpc/AddrResponse'
import type {
  BumpFeeRequest as _walletrpc_BumpFeeRequest,
  BumpFeeRequest__Output as _walletrpc_BumpFeeRequest__Output,
} from '../walletrpc/BumpFeeRequest'
import type {
  BumpFeeResponse as _walletrpc_BumpFeeResponse,
  BumpFeeResponse__Output as _walletrpc_BumpFeeResponse__Output,
} from '../walletrpc/BumpFeeResponse'
import type {
  EstimateFeeRequest as _walletrpc_EstimateFeeRequest,
  EstimateFeeRequest__Output as _walletrpc_EstimateFeeRequest__Output,
} from '../walletrpc/EstimateFeeRequest'
import type {
  EstimateFeeResponse as _walletrpc_EstimateFeeResponse,
  EstimateFeeResponse__Output as _walletrpc_EstimateFeeResponse__Output,
} from '../walletrpc/EstimateFeeResponse'
import type {
  FinalizePsbtRequest as _walletrpc_FinalizePsbtRequest,
  FinalizePsbtRequest__Output as _walletrpc_FinalizePsbtRequest__Output,
} from '../walletrpc/FinalizePsbtRequest'
import type {
  FinalizePsbtResponse as _walletrpc_FinalizePsbtResponse,
  FinalizePsbtResponse__Output as _walletrpc_FinalizePsbtResponse__Output,
} from '../walletrpc/FinalizePsbtResponse'
import type {
  FundPsbtRequest as _walletrpc_FundPsbtRequest,
  FundPsbtRequest__Output as _walletrpc_FundPsbtRequest__Output,
} from '../walletrpc/FundPsbtRequest'
import type {
  FundPsbtResponse as _walletrpc_FundPsbtResponse,
  FundPsbtResponse__Output as _walletrpc_FundPsbtResponse__Output,
} from '../walletrpc/FundPsbtResponse'
import type {
  ImportAccountRequest as _walletrpc_ImportAccountRequest,
  ImportAccountRequest__Output as _walletrpc_ImportAccountRequest__Output,
} from '../walletrpc/ImportAccountRequest'
import type {
  ImportAccountResponse as _walletrpc_ImportAccountResponse,
  ImportAccountResponse__Output as _walletrpc_ImportAccountResponse__Output,
} from '../walletrpc/ImportAccountResponse'
import type {
  ImportPublicKeyRequest as _walletrpc_ImportPublicKeyRequest,
  ImportPublicKeyRequest__Output as _walletrpc_ImportPublicKeyRequest__Output,
} from '../walletrpc/ImportPublicKeyRequest'
import type {
  ImportPublicKeyResponse as _walletrpc_ImportPublicKeyResponse,
  ImportPublicKeyResponse__Output as _walletrpc_ImportPublicKeyResponse__Output,
} from '../walletrpc/ImportPublicKeyResponse'
import type {
  ImportTapscriptRequest as _walletrpc_ImportTapscriptRequest,
  ImportTapscriptRequest__Output as _walletrpc_ImportTapscriptRequest__Output,
} from '../walletrpc/ImportTapscriptRequest'
import type {
  ImportTapscriptResponse as _walletrpc_ImportTapscriptResponse,
  ImportTapscriptResponse__Output as _walletrpc_ImportTapscriptResponse__Output,
} from '../walletrpc/ImportTapscriptResponse'
import type {
  KeyDescriptor as _signrpc_KeyDescriptor,
  KeyDescriptor__Output as _signrpc_KeyDescriptor__Output,
} from '../signrpc/KeyDescriptor'
import type {
  KeyLocator as _signrpc_KeyLocator,
  KeyLocator__Output as _signrpc_KeyLocator__Output,
} from '../signrpc/KeyLocator'
import type {
  KeyReq as _walletrpc_KeyReq,
  KeyReq__Output as _walletrpc_KeyReq__Output,
} from '../walletrpc/KeyReq'
import type {
  LabelTransactionRequest as _walletrpc_LabelTransactionRequest,
  LabelTransactionRequest__Output as _walletrpc_LabelTransactionRequest__Output,
} from '../walletrpc/LabelTransactionRequest'
import type {
  LabelTransactionResponse as _walletrpc_LabelTransactionResponse,
  LabelTransactionResponse__Output as _walletrpc_LabelTransactionResponse__Output,
} from '../walletrpc/LabelTransactionResponse'
import type {
  LeaseOutputRequest as _walletrpc_LeaseOutputRequest,
  LeaseOutputRequest__Output as _walletrpc_LeaseOutputRequest__Output,
} from '../walletrpc/LeaseOutputRequest'
import type {
  LeaseOutputResponse as _walletrpc_LeaseOutputResponse,
  LeaseOutputResponse__Output as _walletrpc_LeaseOutputResponse__Output,
} from '../walletrpc/LeaseOutputResponse'
import type {
  ListAccountsRequest as _walletrpc_ListAccountsRequest,
  ListAccountsRequest__Output as _walletrpc_ListAccountsRequest__Output,
} from '../walletrpc/ListAccountsRequest'
import type {
  ListAccountsResponse as _walletrpc_ListAccountsResponse,
  ListAccountsResponse__Output as _walletrpc_ListAccountsResponse__Output,
} from '../walletrpc/ListAccountsResponse'
import type {
  ListAddressesRequest as _walletrpc_ListAddressesRequest,
  ListAddressesRequest__Output as _walletrpc_ListAddressesRequest__Output,
} from '../walletrpc/ListAddressesRequest'
import type {
  ListAddressesResponse as _walletrpc_ListAddressesResponse,
  ListAddressesResponse__Output as _walletrpc_ListAddressesResponse__Output,
} from '../walletrpc/ListAddressesResponse'
import type {
  ListLeasesRequest as _walletrpc_ListLeasesRequest,
  ListLeasesRequest__Output as _walletrpc_ListLeasesRequest__Output,
} from '../walletrpc/ListLeasesRequest'
import type {
  ListLeasesResponse as _walletrpc_ListLeasesResponse,
  ListLeasesResponse__Output as _walletrpc_ListLeasesResponse__Output,
} from '../walletrpc/ListLeasesResponse'
import type {
  ListSweepsRequest as _walletrpc_ListSweepsRequest,
  ListSweepsRequest__Output as _walletrpc_ListSweepsRequest__Output,
} from '../walletrpc/ListSweepsRequest'
import type {
  ListSweepsResponse as _walletrpc_ListSweepsResponse,
  ListSweepsResponse__Output as _walletrpc_ListSweepsResponse__Output,
} from '../walletrpc/ListSweepsResponse'
import type {
  ListUnspentRequest as _walletrpc_ListUnspentRequest,
  ListUnspentRequest__Output as _walletrpc_ListUnspentRequest__Output,
} from '../walletrpc/ListUnspentRequest'
import type {
  ListUnspentResponse as _walletrpc_ListUnspentResponse,
  ListUnspentResponse__Output as _walletrpc_ListUnspentResponse__Output,
} from '../walletrpc/ListUnspentResponse'
import type {
  PendingSweepsRequest as _walletrpc_PendingSweepsRequest,
  PendingSweepsRequest__Output as _walletrpc_PendingSweepsRequest__Output,
} from '../walletrpc/PendingSweepsRequest'
import type {
  PendingSweepsResponse as _walletrpc_PendingSweepsResponse,
  PendingSweepsResponse__Output as _walletrpc_PendingSweepsResponse__Output,
} from '../walletrpc/PendingSweepsResponse'
import type {
  PublishResponse as _walletrpc_PublishResponse,
  PublishResponse__Output as _walletrpc_PublishResponse__Output,
} from '../walletrpc/PublishResponse'
import type {
  ReleaseOutputRequest as _walletrpc_ReleaseOutputRequest,
  ReleaseOutputRequest__Output as _walletrpc_ReleaseOutputRequest__Output,
} from '../walletrpc/ReleaseOutputRequest'
import type {
  ReleaseOutputResponse as _walletrpc_ReleaseOutputResponse,
  ReleaseOutputResponse__Output as _walletrpc_ReleaseOutputResponse__Output,
} from '../walletrpc/ReleaseOutputResponse'
import type {
  RequiredReserveRequest as _walletrpc_RequiredReserveRequest,
  RequiredReserveRequest__Output as _walletrpc_RequiredReserveRequest__Output,
} from '../walletrpc/RequiredReserveRequest'
import type {
  RequiredReserveResponse as _walletrpc_RequiredReserveResponse,
  RequiredReserveResponse__Output as _walletrpc_RequiredReserveResponse__Output,
} from '../walletrpc/RequiredReserveResponse'
import type {
  SendOutputsRequest as _walletrpc_SendOutputsRequest,
  SendOutputsRequest__Output as _walletrpc_SendOutputsRequest__Output,
} from '../walletrpc/SendOutputsRequest'
import type {
  SendOutputsResponse as _walletrpc_SendOutputsResponse,
  SendOutputsResponse__Output as _walletrpc_SendOutputsResponse__Output,
} from '../walletrpc/SendOutputsResponse'
import type {
  SignMessageWithAddrRequest as _walletrpc_SignMessageWithAddrRequest,
  SignMessageWithAddrRequest__Output as _walletrpc_SignMessageWithAddrRequest__Output,
} from '../walletrpc/SignMessageWithAddrRequest'
import type {
  SignMessageWithAddrResponse as _walletrpc_SignMessageWithAddrResponse,
  SignMessageWithAddrResponse__Output as _walletrpc_SignMessageWithAddrResponse__Output,
} from '../walletrpc/SignMessageWithAddrResponse'
import type {
  SignPsbtRequest as _walletrpc_SignPsbtRequest,
  SignPsbtRequest__Output as _walletrpc_SignPsbtRequest__Output,
} from '../walletrpc/SignPsbtRequest'
import type {
  SignPsbtResponse as _walletrpc_SignPsbtResponse,
  SignPsbtResponse__Output as _walletrpc_SignPsbtResponse__Output,
} from '../walletrpc/SignPsbtResponse'
import type {
  Transaction as _walletrpc_Transaction,
  Transaction__Output as _walletrpc_Transaction__Output,
} from '../walletrpc/Transaction'
import type {
  VerifyMessageWithAddrRequest as _walletrpc_VerifyMessageWithAddrRequest,
  VerifyMessageWithAddrRequest__Output as _walletrpc_VerifyMessageWithAddrRequest__Output,
} from '../walletrpc/VerifyMessageWithAddrRequest'
import type {
  VerifyMessageWithAddrResponse as _walletrpc_VerifyMessageWithAddrResponse,
  VerifyMessageWithAddrResponse__Output as _walletrpc_VerifyMessageWithAddrResponse__Output,
} from '../walletrpc/VerifyMessageWithAddrResponse'

export interface WalletKitClient extends grpc.Client {
  BumpFee(
    argument: _walletrpc_BumpFeeRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_BumpFeeResponse__Output>
  ): grpc.ClientUnaryCall
  BumpFee(
    argument: _walletrpc_BumpFeeRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_BumpFeeResponse__Output>
  ): grpc.ClientUnaryCall
  BumpFee(
    argument: _walletrpc_BumpFeeRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_BumpFeeResponse__Output>
  ): grpc.ClientUnaryCall
  BumpFee(
    argument: _walletrpc_BumpFeeRequest,
    callback: grpc.requestCallback<_walletrpc_BumpFeeResponse__Output>
  ): grpc.ClientUnaryCall
  bumpFee(
    argument: _walletrpc_BumpFeeRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_BumpFeeResponse__Output>
  ): grpc.ClientUnaryCall
  bumpFee(
    argument: _walletrpc_BumpFeeRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_BumpFeeResponse__Output>
  ): grpc.ClientUnaryCall
  bumpFee(
    argument: _walletrpc_BumpFeeRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_BumpFeeResponse__Output>
  ): grpc.ClientUnaryCall
  bumpFee(
    argument: _walletrpc_BumpFeeRequest,
    callback: grpc.requestCallback<_walletrpc_BumpFeeResponse__Output>
  ): grpc.ClientUnaryCall

  DeriveKey(
    argument: _signrpc_KeyLocator,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  DeriveKey(
    argument: _signrpc_KeyLocator,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  DeriveKey(
    argument: _signrpc_KeyLocator,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  DeriveKey(
    argument: _signrpc_KeyLocator,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  deriveKey(
    argument: _signrpc_KeyLocator,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  deriveKey(
    argument: _signrpc_KeyLocator,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  deriveKey(
    argument: _signrpc_KeyLocator,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  deriveKey(
    argument: _signrpc_KeyLocator,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall

  DeriveNextKey(
    argument: _walletrpc_KeyReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  DeriveNextKey(
    argument: _walletrpc_KeyReq,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  DeriveNextKey(
    argument: _walletrpc_KeyReq,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  DeriveNextKey(
    argument: _walletrpc_KeyReq,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  deriveNextKey(
    argument: _walletrpc_KeyReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  deriveNextKey(
    argument: _walletrpc_KeyReq,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  deriveNextKey(
    argument: _walletrpc_KeyReq,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall
  deriveNextKey(
    argument: _walletrpc_KeyReq,
    callback: grpc.requestCallback<_signrpc_KeyDescriptor__Output>
  ): grpc.ClientUnaryCall

  EstimateFee(
    argument: _walletrpc_EstimateFeeRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_EstimateFeeResponse__Output>
  ): grpc.ClientUnaryCall
  EstimateFee(
    argument: _walletrpc_EstimateFeeRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_EstimateFeeResponse__Output>
  ): grpc.ClientUnaryCall
  EstimateFee(
    argument: _walletrpc_EstimateFeeRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_EstimateFeeResponse__Output>
  ): grpc.ClientUnaryCall
  EstimateFee(
    argument: _walletrpc_EstimateFeeRequest,
    callback: grpc.requestCallback<_walletrpc_EstimateFeeResponse__Output>
  ): grpc.ClientUnaryCall
  estimateFee(
    argument: _walletrpc_EstimateFeeRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_EstimateFeeResponse__Output>
  ): grpc.ClientUnaryCall
  estimateFee(
    argument: _walletrpc_EstimateFeeRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_EstimateFeeResponse__Output>
  ): grpc.ClientUnaryCall
  estimateFee(
    argument: _walletrpc_EstimateFeeRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_EstimateFeeResponse__Output>
  ): grpc.ClientUnaryCall
  estimateFee(
    argument: _walletrpc_EstimateFeeRequest,
    callback: grpc.requestCallback<_walletrpc_EstimateFeeResponse__Output>
  ): grpc.ClientUnaryCall

  FinalizePsbt(
    argument: _walletrpc_FinalizePsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_FinalizePsbtResponse__Output>
  ): grpc.ClientUnaryCall
  FinalizePsbt(
    argument: _walletrpc_FinalizePsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_FinalizePsbtResponse__Output>
  ): grpc.ClientUnaryCall
  FinalizePsbt(
    argument: _walletrpc_FinalizePsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_FinalizePsbtResponse__Output>
  ): grpc.ClientUnaryCall
  FinalizePsbt(
    argument: _walletrpc_FinalizePsbtRequest,
    callback: grpc.requestCallback<_walletrpc_FinalizePsbtResponse__Output>
  ): grpc.ClientUnaryCall
  finalizePsbt(
    argument: _walletrpc_FinalizePsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_FinalizePsbtResponse__Output>
  ): grpc.ClientUnaryCall
  finalizePsbt(
    argument: _walletrpc_FinalizePsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_FinalizePsbtResponse__Output>
  ): grpc.ClientUnaryCall
  finalizePsbt(
    argument: _walletrpc_FinalizePsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_FinalizePsbtResponse__Output>
  ): grpc.ClientUnaryCall
  finalizePsbt(
    argument: _walletrpc_FinalizePsbtRequest,
    callback: grpc.requestCallback<_walletrpc_FinalizePsbtResponse__Output>
  ): grpc.ClientUnaryCall

  FundPsbt(
    argument: _walletrpc_FundPsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_FundPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  FundPsbt(
    argument: _walletrpc_FundPsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_FundPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  FundPsbt(
    argument: _walletrpc_FundPsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_FundPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  FundPsbt(
    argument: _walletrpc_FundPsbtRequest,
    callback: grpc.requestCallback<_walletrpc_FundPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  fundPsbt(
    argument: _walletrpc_FundPsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_FundPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  fundPsbt(
    argument: _walletrpc_FundPsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_FundPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  fundPsbt(
    argument: _walletrpc_FundPsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_FundPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  fundPsbt(
    argument: _walletrpc_FundPsbtRequest,
    callback: grpc.requestCallback<_walletrpc_FundPsbtResponse__Output>
  ): grpc.ClientUnaryCall

  ImportAccount(
    argument: _walletrpc_ImportAccountRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportAccountResponse__Output>
  ): grpc.ClientUnaryCall
  ImportAccount(
    argument: _walletrpc_ImportAccountRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ImportAccountResponse__Output>
  ): grpc.ClientUnaryCall
  ImportAccount(
    argument: _walletrpc_ImportAccountRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportAccountResponse__Output>
  ): grpc.ClientUnaryCall
  ImportAccount(
    argument: _walletrpc_ImportAccountRequest,
    callback: grpc.requestCallback<_walletrpc_ImportAccountResponse__Output>
  ): grpc.ClientUnaryCall
  importAccount(
    argument: _walletrpc_ImportAccountRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportAccountResponse__Output>
  ): grpc.ClientUnaryCall
  importAccount(
    argument: _walletrpc_ImportAccountRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ImportAccountResponse__Output>
  ): grpc.ClientUnaryCall
  importAccount(
    argument: _walletrpc_ImportAccountRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportAccountResponse__Output>
  ): grpc.ClientUnaryCall
  importAccount(
    argument: _walletrpc_ImportAccountRequest,
    callback: grpc.requestCallback<_walletrpc_ImportAccountResponse__Output>
  ): grpc.ClientUnaryCall

  ImportPublicKey(
    argument: _walletrpc_ImportPublicKeyRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportPublicKeyResponse__Output>
  ): grpc.ClientUnaryCall
  ImportPublicKey(
    argument: _walletrpc_ImportPublicKeyRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ImportPublicKeyResponse__Output>
  ): grpc.ClientUnaryCall
  ImportPublicKey(
    argument: _walletrpc_ImportPublicKeyRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportPublicKeyResponse__Output>
  ): grpc.ClientUnaryCall
  ImportPublicKey(
    argument: _walletrpc_ImportPublicKeyRequest,
    callback: grpc.requestCallback<_walletrpc_ImportPublicKeyResponse__Output>
  ): grpc.ClientUnaryCall
  importPublicKey(
    argument: _walletrpc_ImportPublicKeyRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportPublicKeyResponse__Output>
  ): grpc.ClientUnaryCall
  importPublicKey(
    argument: _walletrpc_ImportPublicKeyRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ImportPublicKeyResponse__Output>
  ): grpc.ClientUnaryCall
  importPublicKey(
    argument: _walletrpc_ImportPublicKeyRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportPublicKeyResponse__Output>
  ): grpc.ClientUnaryCall
  importPublicKey(
    argument: _walletrpc_ImportPublicKeyRequest,
    callback: grpc.requestCallback<_walletrpc_ImportPublicKeyResponse__Output>
  ): grpc.ClientUnaryCall

  ImportTapscript(
    argument: _walletrpc_ImportTapscriptRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportTapscriptResponse__Output>
  ): grpc.ClientUnaryCall
  ImportTapscript(
    argument: _walletrpc_ImportTapscriptRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ImportTapscriptResponse__Output>
  ): grpc.ClientUnaryCall
  ImportTapscript(
    argument: _walletrpc_ImportTapscriptRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportTapscriptResponse__Output>
  ): grpc.ClientUnaryCall
  ImportTapscript(
    argument: _walletrpc_ImportTapscriptRequest,
    callback: grpc.requestCallback<_walletrpc_ImportTapscriptResponse__Output>
  ): grpc.ClientUnaryCall
  importTapscript(
    argument: _walletrpc_ImportTapscriptRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportTapscriptResponse__Output>
  ): grpc.ClientUnaryCall
  importTapscript(
    argument: _walletrpc_ImportTapscriptRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ImportTapscriptResponse__Output>
  ): grpc.ClientUnaryCall
  importTapscript(
    argument: _walletrpc_ImportTapscriptRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ImportTapscriptResponse__Output>
  ): grpc.ClientUnaryCall
  importTapscript(
    argument: _walletrpc_ImportTapscriptRequest,
    callback: grpc.requestCallback<_walletrpc_ImportTapscriptResponse__Output>
  ): grpc.ClientUnaryCall

  LabelTransaction(
    argument: _walletrpc_LabelTransactionRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_LabelTransactionResponse__Output>
  ): grpc.ClientUnaryCall
  LabelTransaction(
    argument: _walletrpc_LabelTransactionRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_LabelTransactionResponse__Output>
  ): grpc.ClientUnaryCall
  LabelTransaction(
    argument: _walletrpc_LabelTransactionRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_LabelTransactionResponse__Output>
  ): grpc.ClientUnaryCall
  LabelTransaction(
    argument: _walletrpc_LabelTransactionRequest,
    callback: grpc.requestCallback<_walletrpc_LabelTransactionResponse__Output>
  ): grpc.ClientUnaryCall
  labelTransaction(
    argument: _walletrpc_LabelTransactionRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_LabelTransactionResponse__Output>
  ): grpc.ClientUnaryCall
  labelTransaction(
    argument: _walletrpc_LabelTransactionRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_LabelTransactionResponse__Output>
  ): grpc.ClientUnaryCall
  labelTransaction(
    argument: _walletrpc_LabelTransactionRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_LabelTransactionResponse__Output>
  ): grpc.ClientUnaryCall
  labelTransaction(
    argument: _walletrpc_LabelTransactionRequest,
    callback: grpc.requestCallback<_walletrpc_LabelTransactionResponse__Output>
  ): grpc.ClientUnaryCall

  LeaseOutput(
    argument: _walletrpc_LeaseOutputRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_LeaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  LeaseOutput(
    argument: _walletrpc_LeaseOutputRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_LeaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  LeaseOutput(
    argument: _walletrpc_LeaseOutputRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_LeaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  LeaseOutput(
    argument: _walletrpc_LeaseOutputRequest,
    callback: grpc.requestCallback<_walletrpc_LeaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  leaseOutput(
    argument: _walletrpc_LeaseOutputRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_LeaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  leaseOutput(
    argument: _walletrpc_LeaseOutputRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_LeaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  leaseOutput(
    argument: _walletrpc_LeaseOutputRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_LeaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  leaseOutput(
    argument: _walletrpc_LeaseOutputRequest,
    callback: grpc.requestCallback<_walletrpc_LeaseOutputResponse__Output>
  ): grpc.ClientUnaryCall

  ListAccounts(
    argument: _walletrpc_ListAccountsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListAccountsResponse__Output>
  ): grpc.ClientUnaryCall
  ListAccounts(
    argument: _walletrpc_ListAccountsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ListAccountsResponse__Output>
  ): grpc.ClientUnaryCall
  ListAccounts(
    argument: _walletrpc_ListAccountsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListAccountsResponse__Output>
  ): grpc.ClientUnaryCall
  ListAccounts(
    argument: _walletrpc_ListAccountsRequest,
    callback: grpc.requestCallback<_walletrpc_ListAccountsResponse__Output>
  ): grpc.ClientUnaryCall
  listAccounts(
    argument: _walletrpc_ListAccountsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListAccountsResponse__Output>
  ): grpc.ClientUnaryCall
  listAccounts(
    argument: _walletrpc_ListAccountsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ListAccountsResponse__Output>
  ): grpc.ClientUnaryCall
  listAccounts(
    argument: _walletrpc_ListAccountsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListAccountsResponse__Output>
  ): grpc.ClientUnaryCall
  listAccounts(
    argument: _walletrpc_ListAccountsRequest,
    callback: grpc.requestCallback<_walletrpc_ListAccountsResponse__Output>
  ): grpc.ClientUnaryCall

  ListAddresses(
    argument: _walletrpc_ListAddressesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListAddressesResponse__Output>
  ): grpc.ClientUnaryCall
  ListAddresses(
    argument: _walletrpc_ListAddressesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ListAddressesResponse__Output>
  ): grpc.ClientUnaryCall
  ListAddresses(
    argument: _walletrpc_ListAddressesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListAddressesResponse__Output>
  ): grpc.ClientUnaryCall
  ListAddresses(
    argument: _walletrpc_ListAddressesRequest,
    callback: grpc.requestCallback<_walletrpc_ListAddressesResponse__Output>
  ): grpc.ClientUnaryCall
  listAddresses(
    argument: _walletrpc_ListAddressesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListAddressesResponse__Output>
  ): grpc.ClientUnaryCall
  listAddresses(
    argument: _walletrpc_ListAddressesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ListAddressesResponse__Output>
  ): grpc.ClientUnaryCall
  listAddresses(
    argument: _walletrpc_ListAddressesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListAddressesResponse__Output>
  ): grpc.ClientUnaryCall
  listAddresses(
    argument: _walletrpc_ListAddressesRequest,
    callback: grpc.requestCallback<_walletrpc_ListAddressesResponse__Output>
  ): grpc.ClientUnaryCall

  ListLeases(
    argument: _walletrpc_ListLeasesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListLeasesResponse__Output>
  ): grpc.ClientUnaryCall
  ListLeases(
    argument: _walletrpc_ListLeasesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ListLeasesResponse__Output>
  ): grpc.ClientUnaryCall
  ListLeases(
    argument: _walletrpc_ListLeasesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListLeasesResponse__Output>
  ): grpc.ClientUnaryCall
  ListLeases(
    argument: _walletrpc_ListLeasesRequest,
    callback: grpc.requestCallback<_walletrpc_ListLeasesResponse__Output>
  ): grpc.ClientUnaryCall
  listLeases(
    argument: _walletrpc_ListLeasesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListLeasesResponse__Output>
  ): grpc.ClientUnaryCall
  listLeases(
    argument: _walletrpc_ListLeasesRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ListLeasesResponse__Output>
  ): grpc.ClientUnaryCall
  listLeases(
    argument: _walletrpc_ListLeasesRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListLeasesResponse__Output>
  ): grpc.ClientUnaryCall
  listLeases(
    argument: _walletrpc_ListLeasesRequest,
    callback: grpc.requestCallback<_walletrpc_ListLeasesResponse__Output>
  ): grpc.ClientUnaryCall

  ListSweeps(
    argument: _walletrpc_ListSweepsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  ListSweeps(
    argument: _walletrpc_ListSweepsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ListSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  ListSweeps(
    argument: _walletrpc_ListSweepsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  ListSweeps(
    argument: _walletrpc_ListSweepsRequest,
    callback: grpc.requestCallback<_walletrpc_ListSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  listSweeps(
    argument: _walletrpc_ListSweepsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  listSweeps(
    argument: _walletrpc_ListSweepsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ListSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  listSweeps(
    argument: _walletrpc_ListSweepsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  listSweeps(
    argument: _walletrpc_ListSweepsRequest,
    callback: grpc.requestCallback<_walletrpc_ListSweepsResponse__Output>
  ): grpc.ClientUnaryCall

  ListUnspent(
    argument: _walletrpc_ListUnspentRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListUnspentResponse__Output>
  ): grpc.ClientUnaryCall
  ListUnspent(
    argument: _walletrpc_ListUnspentRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ListUnspentResponse__Output>
  ): grpc.ClientUnaryCall
  ListUnspent(
    argument: _walletrpc_ListUnspentRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListUnspentResponse__Output>
  ): grpc.ClientUnaryCall
  ListUnspent(
    argument: _walletrpc_ListUnspentRequest,
    callback: grpc.requestCallback<_walletrpc_ListUnspentResponse__Output>
  ): grpc.ClientUnaryCall
  listUnspent(
    argument: _walletrpc_ListUnspentRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListUnspentResponse__Output>
  ): grpc.ClientUnaryCall
  listUnspent(
    argument: _walletrpc_ListUnspentRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ListUnspentResponse__Output>
  ): grpc.ClientUnaryCall
  listUnspent(
    argument: _walletrpc_ListUnspentRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ListUnspentResponse__Output>
  ): grpc.ClientUnaryCall
  listUnspent(
    argument: _walletrpc_ListUnspentRequest,
    callback: grpc.requestCallback<_walletrpc_ListUnspentResponse__Output>
  ): grpc.ClientUnaryCall

  NextAddr(
    argument: _walletrpc_AddrRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_AddrResponse__Output>
  ): grpc.ClientUnaryCall
  NextAddr(
    argument: _walletrpc_AddrRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_AddrResponse__Output>
  ): grpc.ClientUnaryCall
  NextAddr(
    argument: _walletrpc_AddrRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_AddrResponse__Output>
  ): grpc.ClientUnaryCall
  NextAddr(
    argument: _walletrpc_AddrRequest,
    callback: grpc.requestCallback<_walletrpc_AddrResponse__Output>
  ): grpc.ClientUnaryCall
  nextAddr(
    argument: _walletrpc_AddrRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_AddrResponse__Output>
  ): grpc.ClientUnaryCall
  nextAddr(
    argument: _walletrpc_AddrRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_AddrResponse__Output>
  ): grpc.ClientUnaryCall
  nextAddr(
    argument: _walletrpc_AddrRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_AddrResponse__Output>
  ): grpc.ClientUnaryCall
  nextAddr(
    argument: _walletrpc_AddrRequest,
    callback: grpc.requestCallback<_walletrpc_AddrResponse__Output>
  ): grpc.ClientUnaryCall

  PendingSweeps(
    argument: _walletrpc_PendingSweepsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_PendingSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  PendingSweeps(
    argument: _walletrpc_PendingSweepsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_PendingSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  PendingSweeps(
    argument: _walletrpc_PendingSweepsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_PendingSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  PendingSweeps(
    argument: _walletrpc_PendingSweepsRequest,
    callback: grpc.requestCallback<_walletrpc_PendingSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  pendingSweeps(
    argument: _walletrpc_PendingSweepsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_PendingSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  pendingSweeps(
    argument: _walletrpc_PendingSweepsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_PendingSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  pendingSweeps(
    argument: _walletrpc_PendingSweepsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_PendingSweepsResponse__Output>
  ): grpc.ClientUnaryCall
  pendingSweeps(
    argument: _walletrpc_PendingSweepsRequest,
    callback: grpc.requestCallback<_walletrpc_PendingSweepsResponse__Output>
  ): grpc.ClientUnaryCall

  PublishTransaction(
    argument: _walletrpc_Transaction,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_PublishResponse__Output>
  ): grpc.ClientUnaryCall
  PublishTransaction(
    argument: _walletrpc_Transaction,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_PublishResponse__Output>
  ): grpc.ClientUnaryCall
  PublishTransaction(
    argument: _walletrpc_Transaction,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_PublishResponse__Output>
  ): grpc.ClientUnaryCall
  PublishTransaction(
    argument: _walletrpc_Transaction,
    callback: grpc.requestCallback<_walletrpc_PublishResponse__Output>
  ): grpc.ClientUnaryCall
  publishTransaction(
    argument: _walletrpc_Transaction,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_PublishResponse__Output>
  ): grpc.ClientUnaryCall
  publishTransaction(
    argument: _walletrpc_Transaction,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_PublishResponse__Output>
  ): grpc.ClientUnaryCall
  publishTransaction(
    argument: _walletrpc_Transaction,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_PublishResponse__Output>
  ): grpc.ClientUnaryCall
  publishTransaction(
    argument: _walletrpc_Transaction,
    callback: grpc.requestCallback<_walletrpc_PublishResponse__Output>
  ): grpc.ClientUnaryCall

  ReleaseOutput(
    argument: _walletrpc_ReleaseOutputRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ReleaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  ReleaseOutput(
    argument: _walletrpc_ReleaseOutputRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ReleaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  ReleaseOutput(
    argument: _walletrpc_ReleaseOutputRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ReleaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  ReleaseOutput(
    argument: _walletrpc_ReleaseOutputRequest,
    callback: grpc.requestCallback<_walletrpc_ReleaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  releaseOutput(
    argument: _walletrpc_ReleaseOutputRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ReleaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  releaseOutput(
    argument: _walletrpc_ReleaseOutputRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_ReleaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  releaseOutput(
    argument: _walletrpc_ReleaseOutputRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_ReleaseOutputResponse__Output>
  ): grpc.ClientUnaryCall
  releaseOutput(
    argument: _walletrpc_ReleaseOutputRequest,
    callback: grpc.requestCallback<_walletrpc_ReleaseOutputResponse__Output>
  ): grpc.ClientUnaryCall

  RequiredReserve(
    argument: _walletrpc_RequiredReserveRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_RequiredReserveResponse__Output>
  ): grpc.ClientUnaryCall
  RequiredReserve(
    argument: _walletrpc_RequiredReserveRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_RequiredReserveResponse__Output>
  ): grpc.ClientUnaryCall
  RequiredReserve(
    argument: _walletrpc_RequiredReserveRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_RequiredReserveResponse__Output>
  ): grpc.ClientUnaryCall
  RequiredReserve(
    argument: _walletrpc_RequiredReserveRequest,
    callback: grpc.requestCallback<_walletrpc_RequiredReserveResponse__Output>
  ): grpc.ClientUnaryCall
  requiredReserve(
    argument: _walletrpc_RequiredReserveRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_RequiredReserveResponse__Output>
  ): grpc.ClientUnaryCall
  requiredReserve(
    argument: _walletrpc_RequiredReserveRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_RequiredReserveResponse__Output>
  ): grpc.ClientUnaryCall
  requiredReserve(
    argument: _walletrpc_RequiredReserveRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_RequiredReserveResponse__Output>
  ): grpc.ClientUnaryCall
  requiredReserve(
    argument: _walletrpc_RequiredReserveRequest,
    callback: grpc.requestCallback<_walletrpc_RequiredReserveResponse__Output>
  ): grpc.ClientUnaryCall

  SendOutputs(
    argument: _walletrpc_SendOutputsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SendOutputsResponse__Output>
  ): grpc.ClientUnaryCall
  SendOutputs(
    argument: _walletrpc_SendOutputsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_SendOutputsResponse__Output>
  ): grpc.ClientUnaryCall
  SendOutputs(
    argument: _walletrpc_SendOutputsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SendOutputsResponse__Output>
  ): grpc.ClientUnaryCall
  SendOutputs(
    argument: _walletrpc_SendOutputsRequest,
    callback: grpc.requestCallback<_walletrpc_SendOutputsResponse__Output>
  ): grpc.ClientUnaryCall
  sendOutputs(
    argument: _walletrpc_SendOutputsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SendOutputsResponse__Output>
  ): grpc.ClientUnaryCall
  sendOutputs(
    argument: _walletrpc_SendOutputsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_SendOutputsResponse__Output>
  ): grpc.ClientUnaryCall
  sendOutputs(
    argument: _walletrpc_SendOutputsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SendOutputsResponse__Output>
  ): grpc.ClientUnaryCall
  sendOutputs(
    argument: _walletrpc_SendOutputsRequest,
    callback: grpc.requestCallback<_walletrpc_SendOutputsResponse__Output>
  ): grpc.ClientUnaryCall

  SignMessageWithAddr(
    argument: _walletrpc_SignMessageWithAddrRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SignMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  SignMessageWithAddr(
    argument: _walletrpc_SignMessageWithAddrRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_SignMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  SignMessageWithAddr(
    argument: _walletrpc_SignMessageWithAddrRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SignMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  SignMessageWithAddr(
    argument: _walletrpc_SignMessageWithAddrRequest,
    callback: grpc.requestCallback<_walletrpc_SignMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  signMessageWithAddr(
    argument: _walletrpc_SignMessageWithAddrRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SignMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  signMessageWithAddr(
    argument: _walletrpc_SignMessageWithAddrRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_SignMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  signMessageWithAddr(
    argument: _walletrpc_SignMessageWithAddrRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SignMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  signMessageWithAddr(
    argument: _walletrpc_SignMessageWithAddrRequest,
    callback: grpc.requestCallback<_walletrpc_SignMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall

  SignPsbt(
    argument: _walletrpc_SignPsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SignPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  SignPsbt(
    argument: _walletrpc_SignPsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_SignPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  SignPsbt(
    argument: _walletrpc_SignPsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SignPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  SignPsbt(
    argument: _walletrpc_SignPsbtRequest,
    callback: grpc.requestCallback<_walletrpc_SignPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  signPsbt(
    argument: _walletrpc_SignPsbtRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SignPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  signPsbt(
    argument: _walletrpc_SignPsbtRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_SignPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  signPsbt(
    argument: _walletrpc_SignPsbtRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_SignPsbtResponse__Output>
  ): grpc.ClientUnaryCall
  signPsbt(
    argument: _walletrpc_SignPsbtRequest,
    callback: grpc.requestCallback<_walletrpc_SignPsbtResponse__Output>
  ): grpc.ClientUnaryCall

  VerifyMessageWithAddr(
    argument: _walletrpc_VerifyMessageWithAddrRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_VerifyMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  VerifyMessageWithAddr(
    argument: _walletrpc_VerifyMessageWithAddrRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_VerifyMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  VerifyMessageWithAddr(
    argument: _walletrpc_VerifyMessageWithAddrRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_VerifyMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  VerifyMessageWithAddr(
    argument: _walletrpc_VerifyMessageWithAddrRequest,
    callback: grpc.requestCallback<_walletrpc_VerifyMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  verifyMessageWithAddr(
    argument: _walletrpc_VerifyMessageWithAddrRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_VerifyMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  verifyMessageWithAddr(
    argument: _walletrpc_VerifyMessageWithAddrRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_walletrpc_VerifyMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  verifyMessageWithAddr(
    argument: _walletrpc_VerifyMessageWithAddrRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_walletrpc_VerifyMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
  verifyMessageWithAddr(
    argument: _walletrpc_VerifyMessageWithAddrRequest,
    callback: grpc.requestCallback<_walletrpc_VerifyMessageWithAddrResponse__Output>
  ): grpc.ClientUnaryCall
}

export interface WalletKitHandlers extends grpc.UntypedServiceImplementation {
  BumpFee: grpc.handleUnaryCall<
    _walletrpc_BumpFeeRequest__Output,
    _walletrpc_BumpFeeResponse
  >

  DeriveKey: grpc.handleUnaryCall<
    _signrpc_KeyLocator__Output,
    _signrpc_KeyDescriptor
  >

  DeriveNextKey: grpc.handleUnaryCall<
    _walletrpc_KeyReq__Output,
    _signrpc_KeyDescriptor
  >

  EstimateFee: grpc.handleUnaryCall<
    _walletrpc_EstimateFeeRequest__Output,
    _walletrpc_EstimateFeeResponse
  >

  FinalizePsbt: grpc.handleUnaryCall<
    _walletrpc_FinalizePsbtRequest__Output,
    _walletrpc_FinalizePsbtResponse
  >

  FundPsbt: grpc.handleUnaryCall<
    _walletrpc_FundPsbtRequest__Output,
    _walletrpc_FundPsbtResponse
  >

  ImportAccount: grpc.handleUnaryCall<
    _walletrpc_ImportAccountRequest__Output,
    _walletrpc_ImportAccountResponse
  >

  ImportPublicKey: grpc.handleUnaryCall<
    _walletrpc_ImportPublicKeyRequest__Output,
    _walletrpc_ImportPublicKeyResponse
  >

  ImportTapscript: grpc.handleUnaryCall<
    _walletrpc_ImportTapscriptRequest__Output,
    _walletrpc_ImportTapscriptResponse
  >

  LabelTransaction: grpc.handleUnaryCall<
    _walletrpc_LabelTransactionRequest__Output,
    _walletrpc_LabelTransactionResponse
  >

  LeaseOutput: grpc.handleUnaryCall<
    _walletrpc_LeaseOutputRequest__Output,
    _walletrpc_LeaseOutputResponse
  >

  ListAccounts: grpc.handleUnaryCall<
    _walletrpc_ListAccountsRequest__Output,
    _walletrpc_ListAccountsResponse
  >

  ListAddresses: grpc.handleUnaryCall<
    _walletrpc_ListAddressesRequest__Output,
    _walletrpc_ListAddressesResponse
  >

  ListLeases: grpc.handleUnaryCall<
    _walletrpc_ListLeasesRequest__Output,
    _walletrpc_ListLeasesResponse
  >

  ListSweeps: grpc.handleUnaryCall<
    _walletrpc_ListSweepsRequest__Output,
    _walletrpc_ListSweepsResponse
  >

  ListUnspent: grpc.handleUnaryCall<
    _walletrpc_ListUnspentRequest__Output,
    _walletrpc_ListUnspentResponse
  >

  NextAddr: grpc.handleUnaryCall<
    _walletrpc_AddrRequest__Output,
    _walletrpc_AddrResponse
  >

  PendingSweeps: grpc.handleUnaryCall<
    _walletrpc_PendingSweepsRequest__Output,
    _walletrpc_PendingSweepsResponse
  >

  PublishTransaction: grpc.handleUnaryCall<
    _walletrpc_Transaction__Output,
    _walletrpc_PublishResponse
  >

  ReleaseOutput: grpc.handleUnaryCall<
    _walletrpc_ReleaseOutputRequest__Output,
    _walletrpc_ReleaseOutputResponse
  >

  RequiredReserve: grpc.handleUnaryCall<
    _walletrpc_RequiredReserveRequest__Output,
    _walletrpc_RequiredReserveResponse
  >

  SendOutputs: grpc.handleUnaryCall<
    _walletrpc_SendOutputsRequest__Output,
    _walletrpc_SendOutputsResponse
  >

  SignMessageWithAddr: grpc.handleUnaryCall<
    _walletrpc_SignMessageWithAddrRequest__Output,
    _walletrpc_SignMessageWithAddrResponse
  >

  SignPsbt: grpc.handleUnaryCall<
    _walletrpc_SignPsbtRequest__Output,
    _walletrpc_SignPsbtResponse
  >

  VerifyMessageWithAddr: grpc.handleUnaryCall<
    _walletrpc_VerifyMessageWithAddrRequest__Output,
    _walletrpc_VerifyMessageWithAddrResponse
  >
}

export interface WalletKitDefinition extends grpc.ServiceDefinition {
  BumpFee: MethodDefinition<
    _walletrpc_BumpFeeRequest,
    _walletrpc_BumpFeeResponse,
    _walletrpc_BumpFeeRequest__Output,
    _walletrpc_BumpFeeResponse__Output
  >
  DeriveKey: MethodDefinition<
    _signrpc_KeyLocator,
    _signrpc_KeyDescriptor,
    _signrpc_KeyLocator__Output,
    _signrpc_KeyDescriptor__Output
  >
  DeriveNextKey: MethodDefinition<
    _walletrpc_KeyReq,
    _signrpc_KeyDescriptor,
    _walletrpc_KeyReq__Output,
    _signrpc_KeyDescriptor__Output
  >
  EstimateFee: MethodDefinition<
    _walletrpc_EstimateFeeRequest,
    _walletrpc_EstimateFeeResponse,
    _walletrpc_EstimateFeeRequest__Output,
    _walletrpc_EstimateFeeResponse__Output
  >
  FinalizePsbt: MethodDefinition<
    _walletrpc_FinalizePsbtRequest,
    _walletrpc_FinalizePsbtResponse,
    _walletrpc_FinalizePsbtRequest__Output,
    _walletrpc_FinalizePsbtResponse__Output
  >
  FundPsbt: MethodDefinition<
    _walletrpc_FundPsbtRequest,
    _walletrpc_FundPsbtResponse,
    _walletrpc_FundPsbtRequest__Output,
    _walletrpc_FundPsbtResponse__Output
  >
  ImportAccount: MethodDefinition<
    _walletrpc_ImportAccountRequest,
    _walletrpc_ImportAccountResponse,
    _walletrpc_ImportAccountRequest__Output,
    _walletrpc_ImportAccountResponse__Output
  >
  ImportPublicKey: MethodDefinition<
    _walletrpc_ImportPublicKeyRequest,
    _walletrpc_ImportPublicKeyResponse,
    _walletrpc_ImportPublicKeyRequest__Output,
    _walletrpc_ImportPublicKeyResponse__Output
  >
  ImportTapscript: MethodDefinition<
    _walletrpc_ImportTapscriptRequest,
    _walletrpc_ImportTapscriptResponse,
    _walletrpc_ImportTapscriptRequest__Output,
    _walletrpc_ImportTapscriptResponse__Output
  >
  LabelTransaction: MethodDefinition<
    _walletrpc_LabelTransactionRequest,
    _walletrpc_LabelTransactionResponse,
    _walletrpc_LabelTransactionRequest__Output,
    _walletrpc_LabelTransactionResponse__Output
  >
  LeaseOutput: MethodDefinition<
    _walletrpc_LeaseOutputRequest,
    _walletrpc_LeaseOutputResponse,
    _walletrpc_LeaseOutputRequest__Output,
    _walletrpc_LeaseOutputResponse__Output
  >
  ListAccounts: MethodDefinition<
    _walletrpc_ListAccountsRequest,
    _walletrpc_ListAccountsResponse,
    _walletrpc_ListAccountsRequest__Output,
    _walletrpc_ListAccountsResponse__Output
  >
  ListAddresses: MethodDefinition<
    _walletrpc_ListAddressesRequest,
    _walletrpc_ListAddressesResponse,
    _walletrpc_ListAddressesRequest__Output,
    _walletrpc_ListAddressesResponse__Output
  >
  ListLeases: MethodDefinition<
    _walletrpc_ListLeasesRequest,
    _walletrpc_ListLeasesResponse,
    _walletrpc_ListLeasesRequest__Output,
    _walletrpc_ListLeasesResponse__Output
  >
  ListSweeps: MethodDefinition<
    _walletrpc_ListSweepsRequest,
    _walletrpc_ListSweepsResponse,
    _walletrpc_ListSweepsRequest__Output,
    _walletrpc_ListSweepsResponse__Output
  >
  ListUnspent: MethodDefinition<
    _walletrpc_ListUnspentRequest,
    _walletrpc_ListUnspentResponse,
    _walletrpc_ListUnspentRequest__Output,
    _walletrpc_ListUnspentResponse__Output
  >
  NextAddr: MethodDefinition<
    _walletrpc_AddrRequest,
    _walletrpc_AddrResponse,
    _walletrpc_AddrRequest__Output,
    _walletrpc_AddrResponse__Output
  >
  PendingSweeps: MethodDefinition<
    _walletrpc_PendingSweepsRequest,
    _walletrpc_PendingSweepsResponse,
    _walletrpc_PendingSweepsRequest__Output,
    _walletrpc_PendingSweepsResponse__Output
  >
  PublishTransaction: MethodDefinition<
    _walletrpc_Transaction,
    _walletrpc_PublishResponse,
    _walletrpc_Transaction__Output,
    _walletrpc_PublishResponse__Output
  >
  ReleaseOutput: MethodDefinition<
    _walletrpc_ReleaseOutputRequest,
    _walletrpc_ReleaseOutputResponse,
    _walletrpc_ReleaseOutputRequest__Output,
    _walletrpc_ReleaseOutputResponse__Output
  >
  RequiredReserve: MethodDefinition<
    _walletrpc_RequiredReserveRequest,
    _walletrpc_RequiredReserveResponse,
    _walletrpc_RequiredReserveRequest__Output,
    _walletrpc_RequiredReserveResponse__Output
  >
  SendOutputs: MethodDefinition<
    _walletrpc_SendOutputsRequest,
    _walletrpc_SendOutputsResponse,
    _walletrpc_SendOutputsRequest__Output,
    _walletrpc_SendOutputsResponse__Output
  >
  SignMessageWithAddr: MethodDefinition<
    _walletrpc_SignMessageWithAddrRequest,
    _walletrpc_SignMessageWithAddrResponse,
    _walletrpc_SignMessageWithAddrRequest__Output,
    _walletrpc_SignMessageWithAddrResponse__Output
  >
  SignPsbt: MethodDefinition<
    _walletrpc_SignPsbtRequest,
    _walletrpc_SignPsbtResponse,
    _walletrpc_SignPsbtRequest__Output,
    _walletrpc_SignPsbtResponse__Output
  >
  VerifyMessageWithAddr: MethodDefinition<
    _walletrpc_VerifyMessageWithAddrRequest,
    _walletrpc_VerifyMessageWithAddrResponse,
    _walletrpc_VerifyMessageWithAddrRequest__Output,
    _walletrpc_VerifyMessageWithAddrResponse__Output
  >
}
