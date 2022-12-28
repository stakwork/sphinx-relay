import type * as grpc from '@grpc/grpc-js'
import type {
  EnumTypeDefinition,
  MessageTypeDefinition,
} from '@grpc/proto-loader'

import type {
  SignerClient as _signrpc_SignerClient,
  SignerDefinition as _signrpc_SignerDefinition,
} from './signrpc/Signer'

type SubtypeConstructor<
  Constructor extends new (...args: unknown[]) => unknown,
  Subtype
> = {
  new (...args: ConstructorParameters<Constructor>): Subtype
}

export interface ProtoGrpcType {
  signrpc: {
    InputScript: MessageTypeDefinition
    InputScriptResp: MessageTypeDefinition
    KeyDescriptor: MessageTypeDefinition
    KeyLocator: MessageTypeDefinition
    MuSig2CleanupRequest: MessageTypeDefinition
    MuSig2CleanupResponse: MessageTypeDefinition
    MuSig2CombineKeysRequest: MessageTypeDefinition
    MuSig2CombineKeysResponse: MessageTypeDefinition
    MuSig2CombineSigRequest: MessageTypeDefinition
    MuSig2CombineSigResponse: MessageTypeDefinition
    MuSig2RegisterNoncesRequest: MessageTypeDefinition
    MuSig2RegisterNoncesResponse: MessageTypeDefinition
    MuSig2SessionRequest: MessageTypeDefinition
    MuSig2SessionResponse: MessageTypeDefinition
    MuSig2SignRequest: MessageTypeDefinition
    MuSig2SignResponse: MessageTypeDefinition
    SharedKeyRequest: MessageTypeDefinition
    SharedKeyResponse: MessageTypeDefinition
    SignDescriptor: MessageTypeDefinition
    SignMessageReq: MessageTypeDefinition
    SignMessageResp: MessageTypeDefinition
    SignMethod: EnumTypeDefinition
    SignReq: MessageTypeDefinition
    SignResp: MessageTypeDefinition
    Signer: SubtypeConstructor<typeof grpc.Client, _signrpc_SignerClient> & {
      service: _signrpc_SignerDefinition
    }
    TaprootTweakDesc: MessageTypeDefinition
    TweakDesc: MessageTypeDefinition
    TxOut: MessageTypeDefinition
    VerifyMessageReq: MessageTypeDefinition
    VerifyMessageResp: MessageTypeDefinition
  }
}
