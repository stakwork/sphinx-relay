import {
  GraphSubscriptionRecord,
  models,
  Lsat,
  ChatRecord,
  sequelize,
} from '../models'
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
  const owner = req.owner

  sphinxLogger.info(`=> saveGraphSubscription`, logging.Express)

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

  try {
    const graph = (await models.GraphSubscription.create({
      name,
      address,
      weight,
      status,
      tenant,
    })) as GraphSubscriptionRecord

    if (Array.isArray(chatIds)) {
      for (let i = 0; i < chatIds.length; i++) {
        const chatId = Number(chatIds[i])
        if (!isNaN(chatId)) {
          const chat = (await models.Chat.findOne({
            where: { id: chatId },
          })) as ChatRecord
          if (chat && chat.ownerPubkey === owner.publicKey) {
            await models.GraphSubscriptionChat.create({
              chatId: chat.id,
              subscriptionId: graph.id,
            })
          }
        }
      }
    } else if (chatIds === 'all') {
      const chats = (await models.Chat.findAll({
        where: { ownerPubkey: owner.publicKey },
      })) as ChatRecord[]
      for (let i = 0; i < chats.length; i++) {
        const chat = chats[i]
        await models.GraphSubscriptionChat.create({
          chatId: chat.id,
          subscriptionId: graph.id,
        })
      }
    }
    return success(res, 'Graph Subscription added successfully')
  } catch (error) {
    sphinxLogger.error(
      `=> saveGraphSubscription error: ${error}`,
      logging.Express
    )
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
    sphinxLogger.error(
      `=> getGraphSubscription error: ${error}`,
      logging.Express
    )
    return failure(res, 'An internal error occured')
  }
}

export async function getGraphSubscriptionForTribe(
  req: Req,
  res: Response
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const { id } = req.params
  if (!id) return failure(res, 'Provide valid tribe id')
  try {
    // const tribe = await models.Chat.findOne({ where: { id: tribeId } })
    const tribe = (await models.Chat.findOne({
      where: { id },
    })) as ChatRecord
    if (!tribe) return failure(res, 'Tribe does not exist')
    const results = (await sequelize.query(
      `
      SELECT * FROM sphinx_graph_subscription_chat
      INNER JOIN sphinx_graph_subscription
      ON sphinx_graph_subscription_chat.subscription_id = sphinx_graph_subscription.id
      WHERE sphinx_graph_subscription_chat.chat_id = ${id}`,
      {
        model: models.GraphSubscription,
        mapToModel: true, // pass true here if you have any mapped fields
      }
    )) as GraphSubscriptionRecord[]
    const finalRes: { name: string; address: string; weight: string }[] = []
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const obj = {
        name: result.name,
        address: result.address,
        weight: result.weight,
      }
      finalRes.push(obj)
    }
    return success(res, finalRes)
  } catch (error) {
    sphinxLogger.error(
      `=> getGraphSubscriptionForTribe error: ${error}`,
      logging.Express
    )
    return failure(res, 'An internal error occured')
  }
}
