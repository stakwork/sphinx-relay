import http = require('ava-http')
import * as rsa from '../../crypto/rsa'
import * as moment from 'moment'
import { NodeConfig, RequestArgs, RequestBody } from '../types'
import { config } from '../config'
import * as hmac from '../../crypto/hmac'

export const makeArgs = (
  node: NodeConfig,
  body: RequestBody = {},
  options?
): RequestArgs => {
  const currentTime = moment().unix()
  const headers = {}
  if (options && options.hmacOptions) {
    const rawBody = JSON.stringify(body)
    const { key, method, path } = options.hmacOptions
    const message = `${method}|${path}|${rawBody}`
    const sig = hmac.sign(message, key).toString()
    headers['x-hmac'] = sig
  }
  if (options && options.useTransportToken) {
    headers['x-transport-token'] = rsa.encrypt(
      node.transportToken,
      `${node.authToken}|${currentTime.toString()}`
    )
  } else {
    headers['x-user-token'] = node.authToken
  }
  return { body, headers }
}

export const makeRelayRequest = async (
  method: string,
  path: string,
  node: NodeConfig,
  body?: RequestBody
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const reqFunc = http[method]
  const { response } = await reqFunc(
    node.external_ip + path,
    makeArgs(node, body)
  )
  return response
}

export function randomText() {
  const text = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5)
  return text
}

export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

export async function iterate(
  nodes: NodeConfig[],
  callback: (node1: NodeConfig, node2: NodeConfig) => Promise<void>
): Promise<void> {
  // dont iterate
  if (!config.iterate) {
    return callback(nodes[0], nodes[1])
  }
  // iterate through all node combinations
  const already: string[] = []
  await asyncForEach(nodes, async (n1: NodeConfig) => {
    await asyncForEach(nodes, async (n2: NodeConfig) => {
      if (n1.pubkey !== n2.pubkey) {
        const has = already.find((a) => {
          return a.includes(n1.pubkey) && a.includes(n2.pubkey)
        })
        if (!has) {
          already.push(`${n1.pubkey}-${n2.pubkey}`)
          await callback(n1, n2)
        }
      }
    })
  })
}

export function arraysEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export async function getToken(t, node) {
  //A NODE GETS A SERVER TOKEN FOR POSTING TO MEME SERVER

  const protocol = memeProtocol(config.memeHost)
  //get authentication challenge from meme server
  const r = await http.get(`${protocol}://${config.memeHost}/ask`)
  t.truthy(r, 'r should exist')
  t.truthy(r.challenge, 'r.challenge should exist')

  //call relay server with challenge
  const r2 = await http.get(
    node.external_ip + `/signer/${r.challenge}`,
    makeArgs(node)
  )
  t.true(r2.success, 'r2 should exist')
  t.truthy(r2.response.sig, 'r2.sig should exist')

  //get server token
  const r3 = await http.post(`${protocol}://${config.memeHost}/verify`, {
    form: { id: r.id, sig: r2.response.sig, pubkey: node.pubkey },
  })
  t.truthy(r3, 'r3 should exist')
  t.truthy(r3.token, 'r3.token should exist')

  return r3.token
}

export function memeProtocol(host) {
  let p = 'https'
  if (host.includes('localhost')) p = 'http'
  return p
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getTimestamp() {
  const dateq = moment().utc().format('YYYY-MM-DD%20HH:mm:ss')
  return dateq
}

export function makeJwtArgs(jwt, body) {
  return {
    headers: { 'x-jwt': jwt },
    body,
  }
}
