import { ContentFeedStatusRecord, models } from '../models'
import { Req } from '../types'
import { Response } from 'express'
import { success, failure } from '../utils/res'
import { logging, sphinxLogger } from '../utils/logger'

interface ContentFeed {
  feedId: string
  feedUrl: string
  subscriptionStatus: boolean
  chatId: number
  itemId: string
  episodesStatus: string
  satsPerMinute: number
  playerSpeed: number
  tenant: number
}

interface ContentFeedRes {
  feed_id: string
  feed_url: string
  subscription_status: boolean
  chat_id: number
  item_id: string
  episodes_status: {
    episode_id: {
      duration: number
      current_time: number
    }
  }[]
  sats_per_minute: number
  player_speed: number
}

export async function addContentFeedStatus(
  req: Req,
  res: Response
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { contents } = req.body
  if (!Array.isArray(contents))
    return failure(res, 'Invalid Content Feed Status')
  sphinxLogger.info(`=> Saving Content Feed Status`, logging.Express)
  try {
    await models.ContentFeedStatus.destroy({
      where: { tenant },
    })
    const data: ContentFeed[] = []
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i]
      if (
        content.feed_id &&
        content.feed_url &&
        typeof content.subscription_status === 'boolean'
      ) {
        const contentObj = {
          feedId: content.feed_id,
          feedUrl: content.feed_url,
          subscriptionStatus: content.subscription_status,
          chatId: content.chat_id,
          itemId: content.item_id,
          episodesStatus: JSON.stringify(content.episodes_status),
          satsPerMinute: content.sats_per_minute,
          playerSpeed: content.player_speed,
          tenant,
        }
        data.push(contentObj)
      } else {
        throw 'Invalid Content Feed Status'
      }
    }
    await models.ContentFeedStatus.bulkCreate(data)
    return success(res, 'Content Feed Status added successfully')
  } catch (error) {
    sphinxLogger.error(
      `=> Error Saving Content Feed Status: ${error}`,
      logging.Express
    )
    let errorMsg = 'An internal error occured'
    if (error === 'Invalid Content Feed Status') {
      errorMsg = 'Invalid Content Feed Status'
    }
    return failure(res, errorMsg)
  }
}

export async function getContentFeedStatus(
  req: Req,
  res: Response
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const limit = (req.query.limit && parseInt(req.query.limit as string)) || 1000
  const offset = (req.query.offset && parseInt(req.query.offset as string)) || 0

  sphinxLogger.info(
    `=> getContentFeedStatus, limit: ${limit}, offset: ${offset}`,
    logging.Express
  )

  try {
    const result = (await models.ContentFeedStatus.findAll({
      where: { tenant },
      limit,
      offset,
    })) as ContentFeedStatusRecord[]
    const parsedContent: ContentFeedRes[] = []
    for (let i = 0; i < result.length; i++) {
      const content = result[i]
      const contentObj = {
        feed_id: content.feedId,
        feed_url: content.feedUrl,
        subscription_status: content.subscriptionStatus,
        chat_id: content.chatId,
        item_id: content.itemId,
        episodes_status: JSON.parse(content.episodesStatus),
        sats_per_minute: content.satsPerMinute,
        player_speed: content.playerSpeed,
      }
      parsedContent.push(contentObj)
    }
    return success(res, parsedContent)
  } catch (error) {
    sphinxLogger.error(
      `=> Error Getting Content Feed Status: ${error}`,
      logging.Express
    )
    return failure(res, 'Internal Server Error')
  }
}
