import { ActionHistoryRecord, models } from '../models'
import { Req } from '../types'
import { Response } from 'express'
import { success, failure } from '../utils/res'
import * as feedsHelper from '../utils/feeds'
import { loadConfig } from '../utils/config'
import fetch from 'node-fetch'
import * as rsa from '../crypto/rsa'

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

// This are helper endpoints I am using for getting all Chatbots and message encryption
export async function chatBots(req: Req, res: Response) {
  if (!req.owner) return failure(res, 'no owner')
  // const tenant: number = req.owner.id
  try {
    const chatBots = await models.ChatBot.findAll()
    success(res, chatBots)
  } catch (error) {
    failure(res, error)
  }
}

export async function encrypt(req: Req, res: Response) {
  if (!req.owner) return failure(res, 'no owner')
  const message = rsa.encrypt(req.owner.contactKey, req.body.message)
  const remote_text = rsa.encrypt(
    'MIIBCgKCAQEAuhTjCQuoy9vyJddK03eAxxpYzd9Yu6Tgtj2vp7dFvo9TubNgejqI\nqYH0c1aur30gNuCushJ7TzZFrdXLd77vJ6kVcwOQXI1xNERAG8PvBcSPjv7LZWuz\nYwdM3x7HQ+mBqmib7RjxvEyHNlmoVfrPL5R+LA7lXEJcZqGFO5IBQUK8aWhcvK9L\n5KDcJRend9HmMm6eZOVTijwXOkeB27puZJmW32daJxmabNVbct0ut8WrIjIl+B4s\nthbDZblW5zNdmC8x/5708R0+KTnSjR80/y7Y+j5E3+4w/fS9vMc2VMyDhbkc2vYt\nXD7thfQUtRL2C8BE5fIzF4F9/WWpg9hmpwIDAQAB',
    req.body.message
  )
  const bob_message = rsa.encrypt(
    'MIIBCgKCAQEAq/kgZUWpcpF6BEo6CQtiW+GhpUUdhroeCpf9OdCOgWgxZVKzS34Uz54YYbFu6fwRbNAu4vNQwtOKF8sQjdI8MOdNZUY6Yja1FhBUMwt/Az+K7qg2HTg0cBF/GM3EQabHcKjqWZDPE1HPFM0bC09o30syeYKTSQL1ob9L1UXmaq26npQnPLqntNxwPXWi1bgu/4Rf1p65xUakcAW98L0zWpRQys0+J8qF6zFPaBR/4KkGF1LJIc1geMBHCpsolmWNgRG7uc3btmaslffvHt9XleUArkTN1HefMfOVuwt+mfON2QVeWIXwSyPwYwjSywXbv2+Fnjx8AVgwLY3gBt7+MwIDAQAB',
    req.body.message
  )
  success(res, { message, remote_text, bob: bob_message })
}
