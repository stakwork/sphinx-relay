import { ActionHistoryRecord, models } from '../models'
import { Req } from '../types'
import { Response } from 'express'
import { success, failure } from '../utils/res'
import * as feedsHelper from '../utils/feeds'
import { loadConfig } from '../utils/config'
import fetch from 'node-fetch'

export async function getFeeds(req: Req, res: Response) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const config = loadConfig()
  try {
    const actions = (await models.ActionHistory.findAll({
      where: { tenant },
      limit: 500,
      order: [['updatedAt', 'DESC']],
    })) as ActionHistoryRecord[]
    console.log(actions)
    const parsedActions = feedsHelper.parseActionHistory(actions)
    console.log(parsedActions)
    const recommendations = await fetch(`${config.boltwall_server}/feeds`, {
      method: 'POST',
      body: JSON.stringify(parsedActions),
      headers: { 'Content-Type': 'application/json' },
    })
    const parsedRecommendation = await recommendations.json()
    if (parsedRecommendation.success) {
      success(res, parsedRecommendation.data)
    } else {
      failure(res, 'An error occured')
    }
  } catch (error) {
    failure(res, error)
  }
}
