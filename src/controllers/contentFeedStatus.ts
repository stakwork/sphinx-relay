import { models } from '../models'
import { Req } from '../types'
import { Response } from 'express'
import { success, failure } from '../utils/res'

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

export async function addContentFeedStatus(
  req: Req,
  res: Response
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { contents } = req.body
  if (!Array.isArray(contents))
    return failure(res, 'Invalid Content Feed Status')

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
    let errorMsg = 'An internal error occured'
    if (error === 'Invalid Content Feed Status') {
      errorMsg = 'Invalid Content Feed Status'
    }
    return failure(res, errorMsg)
  }
}
