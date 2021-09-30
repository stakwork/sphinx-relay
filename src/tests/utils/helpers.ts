import http = require('ava-http')
import { NodeConfig, RequestArgs, RequestBody } from '../types'

export const makeArgs = (
  node: NodeConfig,
  body: RequestBody = {}
): RequestArgs => {
  return {
    headers: { 'x-user-token': node.authToken },
    body,
  }
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
