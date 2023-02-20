import { NodeConfig } from '../../types'
import { Assertions } from 'ava'
import { getTribeMember } from './index'

export async function checkTribeMember(
  t: Assertions,
  node1: NodeConfig,
  node2: NodeConfig,
  tribe
): Promise<boolean> {
  const tribeMembers = await getTribeMember(t, node1, tribe.id)
  for (let i = 0; i < tribeMembers.length; i++) {
    let tribeMember = tribeMembers[i]
    if (tribeMember.public_key === node2.pubkey) {
      console.log(tribeMember)
      return true
    }
  }
  return false
}
