import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { iterate } from '../utils/helpers'
import { NodeConfig } from '../types'
import * as http from 'ava-http'
import { makeArgs } from '../utils/helpers'

/*
    npx ava src/tests/controllers/queryRoutes.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial('checkContacts', async (t: ExecutionContext<Context>) => {
  t.true(Array.isArray(nodes))
  await iterate(nodes, async (node1, node2) => {
    await queryRoutes(t, node1, node2)
  })
})

async function queryRoutes(
  t: ExecutionContext<Context>,
  node1: NodeConfig,
  node2: NodeConfig
) {
  console.log(`=> queryRoutes ${node1.alias} -> ${node2.alias}`)

  let q = `pubkey=${node2.pubkey}`
  if (node2.routeHint) {
    q += `&route_hint=${node2.routeHint}`
  }
  const route = await http.get(node1.external_ip + `/route?${q}`, makeArgs(node1))
  t.truthy(
    route.response.success_prob,
    'route response success prob should exist'
  )
  t.true(
    typeof route.response.success_prob === 'number',
    'route response success prob should be a number'
  )
  t.true(
    route.response.success_prob > 0,
    'route response should be greater than 0'
  )
  console.log(
    `${node1.alias} success prob to ${node2.alias}: ${route.response.success_prob}`
  )
}
