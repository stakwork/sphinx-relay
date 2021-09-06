import { Lsat } from 'lsat-js'
import { models } from '../models'
import { logging } from '../utils/logger'
import { failure, success } from '../utils/res'
import * as Lightning from '../grpc/lightning'
import { Response, Request } from 'express'

export interface LsatRequestBody {
  paymentRequest: string
  macaroon: string
  issuer: string
  paths?: string
  metadata?: string
}

export interface RelayRequest extends Request {
  owner: { id: number }
  body: LsatRequestBody
}

interface LsatResponse {
  paymentRequest: string
  macaroon: string
  issuer: string
  paths: string
  preimage: string
  metadata: string
}

const lsatResponseAttributes = [
  'macaroon',
  'paymentRequest',
  'paths',
  'preimage',
  'issuer',
  'metadata',
  'lsatIdentifier',
]

async function lsatAlreadyExists(lsat): Promise<boolean> {
  const lsatIdentifier = lsat.id
  const model = await models.Lsat.findOne({
    where: { lsatIdentifier },
    attributes: lsatResponseAttributes,
  })

  if (model) return true
  return false
}

export async function payForLsat(
  paymentRequest: string
): Promise<string | void> {
  if (!paymentRequest) {
    if (logging.Lightning)
      console.log('[pay invoice] "payment_request" is empty')
    return
  }

  console.log(`[pay invoice] ${paymentRequest}`)

  const response = await Lightning.sendPayment(paymentRequest)

  console.log('[pay invoice data]', response)

  return response.payment_preimage.toString('hex')
}

export async function saveLsat(
  req: RelayRequest,
  res: Response
): Promise<void | Response> {
  const tenant: number = req.owner.id

  if (logging.Express) console.log(`=> saveLsat`)

  const { paymentRequest, macaroon, issuer, paths, metadata } = req.body

  if (!paymentRequest || !macaroon || !issuer) {
    return failure(res, 'Missing required LSAT data')
  }

  let lsat: Lsat
  try {
    lsat = Lsat.fromMacaroon(macaroon, paymentRequest)
  } catch (e) {
    if (logging.Lsat) {
      console.error('[save lsat] Problem getting Lsat:', e.message)
    }
    res.status(400)
    return res.json({ success: false, error: 'invalid lsat macaroon' })
  }

  const lsatIdentifier = lsat.id

  if (await lsatAlreadyExists(lsat)) {
    if (logging.Lsat)
      console.error('[pay for lsat] Lsat already exists: ', lsatIdentifier)
    return failure(res, `Could not save lsat. Already exists`)
  }

  let preimage: string | void

  try {
    preimage = await payForLsat(paymentRequest)
  } catch (e) {
    if (logging.Lsat)
      console.error('[pay for lsat] Problem paying for lsat:', e)

    res.status(500)
    return failure(res, 'Could not pay for lsat')
  }

  if (!preimage) {
    res.status(400)
    return res.json({ success: false, error: 'invoice could not be paid' })
  }

  try {
    lsat.setPreimage(preimage)

    await models.Lsat.create({
      macaroon,
      lsatIdentifier,
      paymentRequest,
      preimage,
      issuer,
      paths,
      metadata,
      tenant,
    })

    return success(res, { success: true, response: { lsat: lsat.toToken() } })
  } catch (e) {
    return failure(res, `failed to save lsat: ${e.message || e}`)
  }
}

export async function getLsat(
  req: RelayRequest,
  res: Response
): Promise<void | Response> {
  const tenant = req.owner.id
  const lsatIdentifier = req.params.identifier

  if (logging.Express) console.log(`=> getLsat`)

  try {
    const lsat: LsatResponse = await models.Lsat.findOne({
      where: { tenant, lsatIdentifier },
      attributes: lsatResponseAttributes,
    })
    return success(res, {
      success: true,
      response: lsat,
    })
  } catch (e) {
    return failure(res, `could not retrieve lsat of id ${lsatIdentifier}`)
  }
}

export async function listLsats(
  req: RelayRequest,
  res: Response
): Promise<void | Response> {
  const tenant = req.owner.id

  if (logging.Express) console.log(`=> listLsats`)
  try {
    const lsats: LsatResponse[] = await models.Lsat.findAll({
      where: { tenant },
      attributes: lsatResponseAttributes,
    })
    return success(res, {
      success: true,
      response: lsats,
    })
  } catch (e) {
    return failure(res, `could not retrieve lsats`)
  }
}

export async function updateLsat(
  req: RelayRequest,
  res: Response
): Promise<void | Response> {
  const tenant = req.owner.id
  const lsatIdentifier = req.params.identifier
  const body = req.body
  if (logging.Express) console.log(`=> updateLsat ${lsatIdentifier}`)
  try {
    await models.Lsat.update(body, {
      where: { tenant, lsatIdentifier },
    })
    return success(res, {
      success: true,
      response: 'lsat successfully updated',
    })
  } catch (e) {
    return failure(res, `could not update lsat`)
  }
}

export async function deleteLsat(
  req: RelayRequest,
  res: Response
): Promise<void | Response> {
  const tenant = req.owner.id
  const lsatIdentifier = req.params.identifier
  if (logging.Express) console.log(`=> deleteLsat ${lsatIdentifier}`)
  try {
    await models.Lsat.destroy({
      where: { tenant, lsatIdentifier },
    })
    return success(res, {
      success: true,
      response: 'lsat successfully deleted',
    })
  } catch (e) {
    return failure(res, `could not delete lsat`)
  }
}
