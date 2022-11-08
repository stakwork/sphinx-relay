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
    })) as ActionHistoryRecord[]
    const parsedActions = feedsHelper.parseActionHistory(actions)
    const recommendations = await fetch(`${config.boltwall_server}/feeds`, {
      method: 'POST',
      body: JSON.stringify(parsedActions),
      headers: { 'Content-Type': 'application/json' },
    })
    const parsedRecommendation = await recommendations.json()
    success(res, parsedRecommendation)
  } catch (error) {
    failure(res, error)
  }
}
