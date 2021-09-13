import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import { makeRelayRequest } from '../helpers'

export const getLsat = async (
  t: Assertions,
  node: NodeConfig,
  identifier: string
): Promise<{ [key: string]: string }> => {
  const { lsat } = await makeRelayRequest('get', `/lsats/${identifier}`, node)
  t.assert(lsat.identifier === identifier, 'lsat did not match identifier')
  return lsat
}
