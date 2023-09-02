import { Response } from 'express'
import { ContentFeedStatusRecord, models } from '../models'
import { Req } from '../types'
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

export async function getAllContentFeedStatus(
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

export async function updateContentFeedStatus(
  req: Req,
  res: Response
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const feedId = req.params.feed_id
  const { content } = req.body
  try {
    const contentExist = (await models.ContentFeedStatus.findOne({
      where: { tenant, feedId },
    })) as ContentFeedStatusRecord
    if (!contentExist) {
      if (
        content.feed_url &&
        typeof content.subscription_status === 'boolean'
      ) {
        await models.ContentFeedStatus.create({
          feedId,
          feedUrl: content.feed_url,
          subscriptionStatus: content.subscription_status,
          chatId: content.chat_id,
          itemId: content.item_id,
          episodesStatus: JSON.stringify(content.episodes_status),
          satsPerMinute: content.sats_per_minute,
          playerSpeed: content.player_speed,
          tenant,
        })
        return success(res, 'Content Status Added Successfully')
      } else {
        return failure(res, 'Content not found')
      }
    } else {
      const updatedContent: Partial<ContentFeed> = {}
      if (content?.feed_url) updatedContent.feedUrl = content.feed_url
      if (
        content?.subscription_status ||
        content?.subscription_status === false
      )
        updatedContent.subscriptionStatus = content.subscription_status
      if (content?.chat_id) updatedContent.chatId = content.chat_id
      if (content?.item_id) updatedContent.itemId = content.item_id
      if (content?.episodes_status)
        updatedContent.episodesStatus = JSON.stringify(content.episodes_status)
      if (content?.sats_per_minute || content?.sats_per_minute === 0)
        updatedContent.satsPerMinute = content.sats_per_minute
      if (content?.player_speed)
        updatedContent.playerSpeed = content.player_speed
      await contentExist.update(updatedContent)
      return success(res, 'Content updated Successfully')
    }
  } catch (error) {
    sphinxLogger.error(
      `=> Error Updating Content Feed Status: ${error}`,
      logging.Express
    )
    return failure(res, 'Internal Server Error')
  }
}

export async function getContentFeedStatus(
  req: Req,
  res: Response
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const feedId = req.params.feed_id

  try {
    const contentFeed = (await models.ContentFeedStatus.findOne({
      where: { feedId, tenant },
    })) as ContentFeedStatusRecord
    if (!contentFeed) {
      return failure(res, 'Content Feed does not exist')
    }
    const resContent: ContentFeedRes = {
      feed_id: contentFeed.feedId,
      feed_url: contentFeed.feedUrl,
      subscription_status: contentFeed.subscriptionStatus,
      chat_id: contentFeed.chatId,
      item_id: contentFeed.itemId,
      episodes_status: JSON.parse(contentFeed.episodesStatus),
      sats_per_minute: contentFeed.satsPerMinute,
      player_speed: contentFeed.playerSpeed,
    }
    return success(res, resContent)
  } catch (error) {
    return failure(res, error)
  }
}
