import fetch from 'node-fetch'
import { NodeConfig } from '../../types'
import * as http from 'ava-http'
import { makeArgs } from '../../utils/helpers'

export async function confirmBadge(node: NodeConfig, badgeId: number) {
  const res = await fetch(
    `https://liquid.sphinx.chat/balances?pubkey=${node.pubkey}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  )
  const results = await res.json()

  for (let i = 0; i < results.balances.length; i++) {
    const balance = results.balances[i]
    if (balance.asset_id === badgeId) {
      return true
    }
  }
  return false
}

export async function confirmBadgeCreatedThroughMessage(
  tribeOwner: NodeConfig,
  nodeBeingChecked: NodeConfig,
  chatId: number,
  reward_type: number
) {
  const res = await fetch(
    `https://liquid.sphinx.chat/balances?pubkey=${nodeBeingChecked.pubkey}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  )
  const results = await res.json()
  const bot = await http.get(
    `${tribeOwner.external_ip}/badge_bot/${chatId}`,
    makeArgs(tribeOwner)
  )
  const badges = JSON.parse(bot.response.meta)
  for (let i = 0; i < badges.length; i++) {
    const badge = badges[i]
    for (let j = 0; j < results.balances.length; j++) {
      const balance = results.balances[j]
      if (
        badge.rewardType === Number(reward_type) &&
        badge.badgeId === balance.asset_id
      ) {
        return true
      }
    }
  }
  return false
}
