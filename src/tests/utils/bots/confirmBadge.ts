import { NodeConfig } from '../../types'
import * as http from 'ava-http'
import { makeArgs, sleep } from '../../utils/helpers'

export async function confirmBadge(node: NodeConfig, badgeId: number) {
  const results = await getBalances()

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
  const results = await getBalances()
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

async function getBalances() {
  await sleep(1000)
  return {
    balances: [
      {
        owner_pubkey:
          '0364c05cbcbb9612036cc66297445a88bcfc21941fd816e17a56b54b0b52ff02b9',
        asset_id: 22222222222222222222222222,
        balance: 1,
      },
    ],
  }
}
