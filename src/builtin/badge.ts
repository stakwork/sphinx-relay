import * as Sphinx from 'sphinx-bot'
// import { sphinxLogger } from '../utils/logger'
import { finalAction } from '../controllers/botapi'

const msg_types = Sphinx.MSG_TYPE

let initted = false
export function init() {
  if (initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    console.log(message)
  })
}
