import type { AbstractLightningApi } from '../api';

import { readFileSync } from 'fs';
import * as grpc from 'grpc';
//import { sleep } from '../../helpers'
//import * as sha from 'js-sha256'
//import * as crypto from 'crypto'
//import constants from '../../constants'
import { getMacaroon } from '../../utils/macaroon'
import { loadConfig } from '../../utils/config'
import { isProxy, loadProxyLightning } from '../../utils/proxy'
//import { logging, sphinxLogger } from '../../utils/logger'
import * as interfaces from '../../grpc/interfaces'
//import * as zbase32 from '../../utils/zbase32'
//import * as secp256k1 from 'secp256k1'
//import { Req } from '../../types'

import type { LightningClient } from '../grpc_types/lnrpc/Lightning';
// import type { LightningClient as ProxyLightningClient } from '../grpc_types/lnrpc_proxy/Lightning';

const config = loadConfig();
const LND_IP = config.lnd_ip || 'localhost';
const FEE_LIMIT_SAT = 10000;

export class LndApi implements AbstractLightningApi {
  private lightningClient: LightningClient | undefined; // | ProxyLightningClient | undefined;

  private loadCredentials(macName?: string): grpc.ChannelCredentials {
    try {
      const lndCert = readFileSync(config.tls_location)
      const sslCreds = grpc.credentials.createSsl(lndCert)
      const macaroon = getMacaroon(macName)
      const metadata = new grpc.Metadata()
      metadata.add('macaroon', macaroon)
      const macaroonCreds = grpc.credentials.createFromMetadataGenerator(
        (_args, callback) => {
          callback(null, metadata)
        }
      )

      return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds)
    } catch (e) {
      // console.log(e)
      throw 'cannot read LND macaroon or cert'
    }
  }

  private async load(
    tryProxy?: boolean,
    ownerPubkey?: string
  ): Promise<void> {
    // only if specified AND available
    if (tryProxy && isProxy() && ownerPubkey) {
      this.lightningClient = await <any>loadProxyLightning(ownerPubkey); // TODO fix typing
      return;
    }

    // LND
    const credentials = this.loadCredentials()
    const lnrpcDescriptor: any = grpc.load('proto/lightning.proto')
    const lnrpc = lnrpcDescriptor.lnrpc
    this.lightningClient = new lnrpc.Lightning(
      LND_IP + ':' + config.lnd_port,
      credentials
    )
  }

  async payInvoice(invoice: string, ownerPubkey?: string) {
    await this.load(true, ownerPubkey);
    return new Promise<interfaces.SendPaymentResponse>((resolve, reject) => {
      this.lightningClient!.sendPaymentSync({ payment_request: invoice, fee_limit: { fixed: FEE_LIMIT_SAT }}, (err, res) => {
        if (err || !res) {
          reject(err)
        } else {
          if (res.payment_error) {
            reject(res.payment_error)
          } else {
            if (res.payment_route) {
              resolve(<any>res) // TODO fix typing
            }
          }
        }
      })
    });
  }
}
