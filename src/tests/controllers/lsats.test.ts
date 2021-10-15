import test, { ExecutionContext } from 'ava'
import { Lsat } from 'lsat-js'
import { NodeConfig } from '../types'
import { makeRelayRequest } from '../utils/helpers'
import nodes from '../nodes'

import { saveLsat } from '../utils/save'
import { getLsat } from '../utils/get'

const alice: NodeConfig = nodes[0]
const bob: NodeConfig = nodes[1]

interface Context {
  identifiers: string[]
}

const getIdentifierFromToken = (token: string): string =>
  Lsat.fromToken(token).id

const addLsatToContext = (
  t: ExecutionContext<Context>,
  token: string
): string => {
  const identifier = getIdentifierFromToken(token)
  t.assert(identifier.length)
  t.context.identifiers.push(identifier)
  return identifier
}

test.before((t: ExecutionContext<Context>) => {
  t.context.identifiers = []
})

test.after.always('cleanup lsats', async (t: ExecutionContext<Context>) => {
  const { identifiers } = t.context
  for (const i of identifiers) {
    try {
      await makeRelayRequest('del', `/lsats/${i}`, alice)
    } catch (e) {
      console.error(`Could not cleanup lsat ${i}, ${e.message}`)
    }
  }
})

test.serial('saveLsat', async (t: ExecutionContext<Context>) => {
  const token = await saveLsat(t, nodes[0], nodes[1])

  t.assert(token.length, 'expected an lsat token in response')
  addLsatToContext(t, token)
})

test.serial('getLsat', async (t: ExecutionContext<Context>) => {
  const token = await saveLsat(t, alice, bob)
  const identifier = addLsatToContext(t, token)

  const { lsat } = await makeRelayRequest('get', `/lsats/${identifier}`, alice)
  t.assert(lsat, 'expected to get the lsat back')
  t.truthy(lsat.preimage, 'LSAT should have preimage as proof of payment')
})

test.serial('listLsats', async (t: ExecutionContext<Context>) => {
  let { lsats } = await makeRelayRequest('get', '/lsats', alice)
  const initialCount = lsats.length
  t.assert(initialCount || initialCount === 0, 'expected to get list of lsats')
  const lsatCount = 3
  let counter = 0

  while (counter < lsatCount) {
    counter++
    const token = await saveLsat(t, alice, bob)
    addLsatToContext(t, token)
  }

  lsats = (await makeRelayRequest('get', '/lsats', alice)).lsats
  t.assert(lsats.length === initialCount + lsatCount)
})

test.serial('updateLsat', async (t: ExecutionContext<Context>) => {
  const token = await saveLsat(t, alice, bob)
  const identifier = addLsatToContext(t, token)
  let lsat = await getLsat(t, alice, identifier)
  t.assert(lsat.metadata === null, 'expected lsat metadata to be null')

  const metadata = {
    foo: 'bar',
  }

  await makeRelayRequest('put', `/lsats/${identifier}`, alice, {
    metadata: JSON.stringify(metadata),
  })

  lsat = await getLsat(t, alice, identifier)
  const updated = JSON.parse(lsat.metadata)
  t.deepEqual(updated, metadata)
})

test.serial('deleteLsats', async (t: ExecutionContext<Context>) => {
  const token = await saveLsat(t, alice, bob)
  const identifier = getIdentifierFromToken(token)
  await makeRelayRequest('del', `/lsats/${identifier}`, alice)
  try {
    await makeRelayRequest('get', `/lsats/${identifier}`, alice)
    t.fail('expected GET request to fail')
  } catch (e) {
    t.is(e.response.statusCode, 404)
  }
})
