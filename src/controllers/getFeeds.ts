import { ActionHistoryRecord, models } from '../models'
import { Req } from '../types'
import { Response } from 'express'
import { success, failure } from '../utils/res'
import * as feedsHelper from '../utils/feeds'

export async function getFeeds(req: Req, res: Response) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  try {
    const actions = (await models.ActionHistory.findAll({
      where: { tenant },
    })) as ActionHistoryRecord[]
    const parsedActions = feedsHelper.parseActionHistory(actions)
    success(res, parsedActions)
  } catch (error) {
    failure(res, error)
  }
}
