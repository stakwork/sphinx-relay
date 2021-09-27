import { Assertions, ExecutionContext } from 'ava'
import { getRawMacaroon, Identifier } from 'lsat-js'
import { randomBytes } from 'crypto'
import { decode } from '@boltz/bolt11'
import * as Macaroon from 'macaroon'
import { makeRelayRequest } from '../../utils/helpers'
import { createNewInvoice } from '../../utils/createNewInvoice'
import { LsatRequestBody } from '../../../controllers/lsats'
import { NodeConfig } from '../../types'

const macaroonSigningKey = randomBytes(32).toString('hex')

const macaroonFromInvoice = (t: Assertions, payreq: string): string => {
  const invoice = decode(payreq)
  const paymentHash =
    invoice.tags
      .find((tag) => tag.tagName === 'payment_hash')
      ?.data.toString() || ''

  t.truthy(paymentHash, 'expected a payment hash in the payment request')

  const mac = Macaroon.newMacaroon({
    version: 1,
    rootKey: macaroonSigningKey,
    identifier: new Identifier({
      paymentHash: Buffer.from(paymentHash, 'hex'),
    }).toString(),
    location: 'tests',
  })
  return getRawMacaroon(mac)
}

export const saveLsat = async (
  t: ExecutionContext,
  payer: NodeConfig,
  receiver: NodeConfig
): Promise<string> => {
  const { invoice } = await createNewInvoice(t, receiver, 500)
  const macaroon = macaroonFromInvoice(t, invoice)

  const args: LsatRequestBody = {
    paymentRequest: invoice,
    macaroon,
    issuer: receiver.ip,
  }
  const { lsat: token } = await makeRelayRequest('post', '/lsats', payer, args)

  t.assert(token.length, 'expected an lsat token in response')
  return token
}
