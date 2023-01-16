import { GraphSubscriptionRecord, models, Lsat } from '../models'
import { Req } from '../types'
import { Response } from 'express'
import { failure, success } from '../utils/res'
import { logging, sphinxLogger } from '../utils/logger'

export async function addGraphSubscription(
  req: Req,
  res: Response
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  sphinxLogger.info(`=> saveLsat`, logging.Express)

  const { name, address, weight, status } = req.body
  let { chatIds } = req.body
  if (!name || !address || !weight) {
    return failure(res, 'Missing required Graph Subscription data')
  }

  if (typeof status !== 'number' || status > 1) {
    return failure(res, 'Provide valid graph status')
  }

  if (chatIds !== 'all' && !Array.isArray(chatIds)) {
    return failure(res, 'Provide valid tribe Id')
  }

  if (Array.isArray(chatIds)) {
    chatIds = JSON.stringify(chatIds)
  }

  try {
    await models.GraphSubscription.create({
      name,
      address,
      weight,
      status,
      chatIds,
      tenant,
    })
    return success(res, 'Graph Subscription added successfully')
  } catch (error) {
    console.log(error)
    return failure(res, 'An internal error occured')
  }
}

export async function getGraphSubscription(
  req: Req,
  res: Response
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  try {
    const graphs =
      (await models.GraphSubscription.findAll()) as GraphSubscriptionRecord[]

    const newGraphs: {
      client_name: string
      prediction_endpoint: string
      lsat: string
    }[] = []
    for (let i = 0; i < graphs.length; i++) {
      const graph = graphs[i]
      const lsat = (await models.Lsat.findOne({
        where: { paths: graph.address, status: 1 },
      })) as Lsat
      const obj = {
        client_name: graph.name,
        prediction_endpoint: graph.address,
        lsat: lsat ? `${lsat.macaroon}:${lsat.preimage}` : '',
      }
      newGraphs.push(obj)
    }
    return success(res, newGraphs)
  } catch (error) {
    console.log(error)
    return failure(res, 'An internal error occured')
  }
}
