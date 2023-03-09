import * as Sphinx from 'sphinx-bot'
// import { sphinxLogger, logging } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import { ChatRecord, models } from '../models'
import { threshold, checkThreshold, timer, updateUrl } from './utill/sentiment'

const msg_types = Sphinx.MSG_TYPE

let initted = false
const botPrefix = '/sentiment'
const botName = 'SentimentBot'
let interval

export function init() {
  if (initted) return
  initted = true
  //   const commands = ['hide', 'add', 'remove']
  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    if (
      message.author?.bot !== botPrefix &&
      message.content !== '/bot install sentiment'
    )
      return
    const arr = (message.content && message.content.split(' ')) || []

    const tribe = (await models.Chat.findOne({
      where: { uuid: message.channel.id },
    })) as ChatRecord

    if (!interval) {
      interval = setInterval(() => {
        checkThreshold(
          tribe,
          botName,
          botPrefix,
          interval,
          'threshold',
          message
        )
      }, 60000)
      //   timerMs(1)
    }

    if (arr[0] === botPrefix) {
      const cmd = arr[1]
      switch (cmd) {
        case 'threshold':
          if (arr.length < 3) return
          await threshold(botName, cmd, tribe, botPrefix, message, arr[2])
          return
        case 'timer':
          if (arr.length < 3) return
          await timer(botName, cmd, tribe, botPrefix, message, arr[2], interval)
          return
        case 'url':
          if (arr.length < 3) return
          await updateUrl(botPrefix, botName, arr[2], tribe, cmd, message)
          return
      }
    }
  })
}
