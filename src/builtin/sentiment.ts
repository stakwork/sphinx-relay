import * as Sphinx from 'sphinx-bot'
// import { sphinxLogger, logging } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import { ChatRecord, models } from '../models'
import { threshold } from './utill/sentiment'

const msg_types = Sphinx.MSG_TYPE

let initted = false
const botPrefix = '/sentiment'
const botName = 'SentimentBot'

export function init() {
  if (initted) return
  initted = true
  //   const commands = ['hide', 'add', 'remove']
  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    if (message.author?.bot !== botPrefix) return
    const arr = (message.content && message.content.split(' ')) || []

    if (arr[0] !== botPrefix) return
    const cmd = arr[1]
    const tribe = (await models.Chat.findOne({
      where: { uuid: message.channel.id },
    })) as ChatRecord

    switch (cmd) {
      case 'threshold':
        if (arr.length < 3) return
        await threshold(botName, cmd, tribe, botPrefix, message, arr[2])
        return
      case 'timer':
        if (arr.length < 3) return
    }
  })
}
