import { Lsat } from 'lsat-js'
import { models } from '../models'
import { logging } from '../utils/logger'
import { failure, success } from '../utils/res'
import * as Lightning from '../grpc/lightning'
import { Response } from 'express'

export async function payForLsat(
  paymentRequest: string
): Promise<string | void> {
  if (!paymentRequest) {
    if (logging.Lightning)
      console.log('[pay invoice] "payment_request" is empty')
    return
  }

  console.log(`[pay invoice] ${paymentRequest}`)

  const response: { payment_preimage: string } = await Lightning.sendPayment(
    paymentRequest
  )

  console.log('[pay invoice data]', response)

  // TODO: confirm there is a response.payment_preimage
  return response.payment_preimage
}

export async function saveLsat(req, res): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const { paymentRequest, macaroon, issuer, paths, photoUrl } = req.body

  let lsat: Lsat
  try {
    lsat = Lsat.fromMacaron(macaroon, paymentRequest)
  } catch (e) {
    if (logging.Lsat) {
      console.error('[save lsat] Problem getting Lsat:', e.message)
    }
    res.status(400)
    return res.json({ success: false, error: 'invalid lsat macaroon' })
  }

  const lsatIdentifier = lsat.id

  const preimage = await payForLsat(paymentRequest)

  if (!preimage) {
    res.status(400)
    return res.json({ success: false, error: 'invoice could not be paid' })
  }

  await models.Lsat.create({
    lsatIdentifier,
    paymentRequest,
    preimage,
    issuer,
    paths,
    photoUrl,
    tenant,
  })

  lsat.setPreimage(preimage)

  res.status(200)
  return success(res, { success: true, resposne: { lsat: lsat.toToken() } })
}

export async function updateLsat() {}

export async function getLsat() {}

export async function deleteLsat() {}
