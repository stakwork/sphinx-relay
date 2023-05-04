// Generated file. Do not edit. Edit the template proto.ts.template instead.

import * as grpc from '@grpc/grpc-js'
import { loadSync, Options } from '@grpc/proto-loader'

import type { ProtoGrpcType as NodeProtoGrpcType } from './types/cln/node'
import type { ProtoGrpcType as PrimitivesProtoGrpcType } from './types/cln/primitives'
import type { ProtoGrpcType as GreenlightProtoGrpcType } from './types/greenlight'
import type { ProtoGrpcType as LightningProtoGrpcType } from './types/lightning'
import type { ProtoGrpcType as RouterProtoGrpcType } from './types/router'
import type { ProtoGrpcType as Rpc_proxyProtoGrpcType } from './types/rpc_proxy'
import type { ProtoGrpcType as SchedulerProtoGrpcType } from './types/scheduler'
import type { ProtoGrpcType as SignerProtoGrpcType } from './types/signer'
import type { ProtoGrpcType as WalletkitProtoGrpcType } from './types/walletkit'
import type { ProtoGrpcType as WalletunlockerProtoGrpcType } from './types/walletunlocker'

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

type ProtoName =
  | 'cln/node'
  | 'cln/primitives'
  | 'greenlight'
  | 'lightning'
  | 'router'
  | 'rpc_proxy'
  | 'scheduler'
  | 'signer'
  | 'walletkit'
  | 'walletunlocker'

type ProtoGrpcType =
  | NodeProtoGrpcType
  | PrimitivesProtoGrpcType
  | GreenlightProtoGrpcType
  | LightningProtoGrpcType
  | RouterProtoGrpcType
  | Rpc_proxyProtoGrpcType
  | SchedulerProtoGrpcType
  | SignerProtoGrpcType
  | WalletkitProtoGrpcType
  | WalletunlockerProtoGrpcType

const opts: Options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
}

export function loadProto(name: 'cln/node'): NodeProtoGrpcType
export function loadProto(name: 'cln/primitives'): PrimitivesProtoGrpcType
export function loadProto(name: 'greenlight'): GreenlightProtoGrpcType
export function loadProto(name: 'lightning'): LightningProtoGrpcType
export function loadProto(name: 'router'): RouterProtoGrpcType
export function loadProto(name: 'rpc_proxy'): Rpc_proxyProtoGrpcType
export function loadProto(name: 'scheduler'): SchedulerProtoGrpcType
export function loadProto(name: 'signer'): SignerProtoGrpcType
export function loadProto(name: 'walletkit'): WalletkitProtoGrpcType
export function loadProto(name: 'walletunlocker'): WalletunlockerProtoGrpcType
export function loadProto(name: ProtoName): ProtoGrpcType
export function loadProto(name: ProtoName): ProtoGrpcType {
  return grpc.loadPackageDefinition(
    loadSync(`proto/${name}.proto`, opts)
  ) as unknown as ProtoGrpcType
}
