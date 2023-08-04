import * as Sphinx from 'sphinx-bot'
import { finalAction } from '../controllers/botapi'
import { ChatRecord, models, ChatBotRecord } from '../models'
import { findBot } from './utill'

const msg_types = Sphinx.MSG_TYPE

let initted = false

export const ML_PREFIX = '/ml'

export const CALLBACKS: { [k: string]: (msg: string) => void } = {}

export function init() {
  if (initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    // if (message.author?.bot !== botPrefix) return

    const isAdmin = message.member.roles.find((role) => role.name === 'Admin')

    try {
      const tribe = (await models.Chat.findOne({
        where: { uuid: message.channel.id },
      })) as ChatRecord

      const bot: ChatBotRecord = await findBot({ botPrefix: '/ML', tribe })

      let meta: MlMeta = JSON.parse(bot.meta || `{}`)
      const url = meta.url
      if (!url) {
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('ML Bot')
          .setDescription('not configured')
          .setOnlyOwner(isAdmin ? true : false)
        message.channel.send({ embed })
        return
      }

      const r = await fetch(`${url}/conversation`, {
        method: 'POST',
        body: JSON.stringify({
          message: message.content,
          webhook: '',
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
      const j = await r.json()
      if (!j.process_id) {
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('ML Bot')
          .setDescription('failed to process message')
          .setOnlyOwner(isAdmin ? true : false)
        message.channel.send({ embed })
        return
      }

      function cb(msg: string) {
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('ML Bot')
          .setDescription(msg)
          .setOnlyOwner(isAdmin ? true : false)
        // .setOnlyUser(message.member.id)
        message.channel.send({ embed })
      }

      CALLBACKS[j.process_id] = cb

      setTimeout(() => {
        delete CALLBACKS[j.process_id]
      }, 5 * 60 * 1000)
    } catch (e) {
      console.error(e)
    }
  })
}

export interface MlMeta {
  url: string
  apiKey: string
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
