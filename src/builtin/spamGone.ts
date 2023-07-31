import * as Sphinx from 'sphinx-bot'
import { finalAction } from '../controllers/botapi'
import { ChatRecord, models } from '../models'
import { addPubkeyToSpam } from './utill/spamGone'

const msg_types = Sphinx.MSG_TYPE

let initted = false
const botPrefix = '/spam_gone'
const botName = 'SpamGoneBot'

export function init() {
  if (initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    if (message.author?.bot !== botPrefix) return

    const arr = (message.content && message.content.split(' ')) || []
    if (arr[0] !== botPrefix) return
    const cmd = arr[1]
    const isAdmin = message.member.roles.find((role) => role.name === 'Admin')

    if (!isAdmin) return

    try {
      const tribe = (await models.Chat.findOne({
        where: { uuid: message.channel.id },
      })) as ChatRecord

      switch (cmd) {
        case 'add':
          await addPubkeyToSpam(arr, botPrefix, botName, tribe, message)
          return
      }
    } catch (error) {}
  })
}
