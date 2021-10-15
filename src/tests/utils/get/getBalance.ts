import { Assertions } from 'ava'
import * as http from 'ava-http'
import { NodeConfig } from '../../types'
import { makeArgs } from '../helpers'

export const getBalance = async (
  t: Assertions,
  node: NodeConfig
): Promise<number> => {
  //GET BALANCE OF NODE ===>

  const r = await http.get(node.external_ip + '/balance', makeArgs(node))
  t.true(r.success, 'should get node balance')
  const nodeBalance = r.response.balance

  return nodeBalance
}
