import * as http from 'ava-http'
import { makeArgs } from '../helpers'
import { Assertions } from 'ava'
import { NodeConfig } from '../../types'
import { config } from '../../config'

export async function setTribePreview(
  t: Assertions,
  node1: NodeConfig,
  tribe,
  url?: string
) {
  const body = {
    preview: url,
  }
  if (config.cache) {
    const preview = await http.post(
      `${node1.external_ip}/preview/${tribe.id}`,
      makeArgs(node1, body)
    )

    t.true(preview.success, `Preview should be set for ${tribe.name}`)
  }
  return true
}
