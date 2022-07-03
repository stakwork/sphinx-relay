import type { AbstractLightningApi } from '../api';

import { readFileSync } from 'fs';
import { loadConfig } from '../../utils/config';
import * as grpc from 'grpc';

import { get_greenlight_grpc_uri } from '../../grpc/greenlight';
import * as interfaces from '../../grpc/interfaces';

import type { NodeClient } from '../grpc_types/greenlight/Node';

const config = loadConfig();

export class GreenlightApi implements AbstractLightningApi {
  private lightningClient: NodeClient;

  constructor() {
    this.load();
  }

  private loadGreenlightCredentials(): grpc.ChannelCredentials {
    const glCert = readFileSync(config.tls_location);
    const glPriv = readFileSync(config.tls_key_location);
    const glChain = readFileSync(config.tls_chain_location);
    return grpc.credentials.createSsl(glCert, glPriv, glChain);
  }

  private load(): void {
    const credentials = this.loadGreenlightCredentials()
    const descriptor = grpc.load('proto/greenlight.proto')
    const greenlight: any = descriptor.greenlight
    const options = {
      'grpc.ssl_target_name_override': 'localhost',
    }
    const uri = get_greenlight_grpc_uri().split('//')
    if (!uri[1]) return
    this.lightningClient = new greenlight.Node(uri[1], credentials, options)
  }

  async payInvoice(invoice: string) {
    this.load();
    return new Promise<interfaces.SendPaymentResponse>((resolve, reject) => {
      this.lightningClient.pay({ bolt11: invoice, timeout: 12 }, (err, res) => {
        if (err || !res || !res.amount) {
          reject(err)
        } else {
          const route = <interfaces.Route>{}
          const { satoshi, millisatoshi } = interfaces.greenlightAmoutToAmounts(res.amount)
          route.total_amt = satoshi
          route.total_amt_msat = millisatoshi
          resolve({
            payment_error:
              res.status === 'FAILED' ? 'payment failed' : '',
            payment_preimage: res.payment_preimage,
            payment_hash: res.payment_hash,
            payment_route: route,
          });
        }
      });
    });
  }
}
