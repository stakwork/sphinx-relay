import fetch from 'node-fetch'
import { NodeConfig } from '../../types'

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
