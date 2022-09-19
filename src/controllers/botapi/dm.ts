import { Action, validateAction } from './index'
import { sphinxLogger } from '../../utils/logger'
import { models } from '../../models'

export default async function dm(a: Action): Promise<void> {
  const { amount, content, bot_name, pubkey } = a

  sphinxLogger.info(`=> BOT DM ${JSON.stringify(a, null, 2)}`)
  const ret = await validateAction(a)
  if (!ret) return
  let { chat, owner } = ret
  const tenant: number = owner.id
  const alias = bot_name || owner.alias
  if (!pubkey) return sphinxLogger.error('bot DM no pubkey')

  const contact = await models.Contact.findOne({
    where: { publicKey: pubkey, tenant },
  })
  if (!contact) return sphinxLogger.error('bot DM no contact')

  // get Chat by the uuid (hash of 2 pubkeys)
  // make the message for admin's own node
  // network.sendMessage
}
