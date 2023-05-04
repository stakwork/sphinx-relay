import { ActionHistoryRecord, models } from '../models'
import { Req } from '../types'
import { Response } from 'express'
import { success, failure } from '../utils/res'
import * as feedsHelper from '../utils/feeds'
import { loadConfig } from '../utils/config'
import fetch from 'node-fetch'

export async function getFeeds(
  req: Req,
  res: Response
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const config = loadConfig()
  try {
    //TODO: compress the request
    // limit set to 90 because request size was getting to large
    const actions = (await models.ActionHistory.findAll({
      where: { tenant },
      limit: 25,
      order: [['updatedAt', 'DESC']],
    })) as ActionHistoryRecord[]
    const parsedActions = {
      ...feedsHelper.parseActionHistory(actions),
      publicKey: req.owner.publicKey,
    }
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
