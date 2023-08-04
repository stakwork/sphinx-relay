import * as Sphinx from 'sphinx-bot'
import { finalAction } from '../controllers/botapi'
import { ChatRecord, models, ChatBotRecord } from '../models'
import { findBot, botResponse } from './utill'
import { loadConfig } from '../utils/config'

const config = loadConfig()

const msg_types = Sphinx.MSG_TYPE

let initted = false

export const ML_PREFIX = '/ml'

export const ML_BOTNAME = `${ML_PREFIX.substring(
  1,
  2
).toUpperCase()}${ML_PREFIX.substring(2)}Bot`

export const CALLBACKS: { [k: string]: (msg: string) => void } = {}

export function init() {
  if (initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    if (message.author?.bot !== ML_PREFIX) return

    const isAdmin = message.member.roles.find((role) => role.name === 'Admin')

    try {
      const tribe = (await models.Chat.findOne({
        where: { uuid: message.channel.id },
      })) as ChatRecord

      const bot: ChatBotRecord = await findBot({ botPrefix: '/ML', tribe })

      let meta: MlMeta = JSON.parse(bot.meta || `{}`)
      const url = meta.url
      const api_key = meta.apiKey
      if (isAdmin) {
        const arr = (message.content && message.content.split(' ')) || []
        const cmd = arr[1]

        switch (cmd) {
          case 'url':
            const newUrl = arr[2]
            if (!newUrl) {
              await botResponse(
                ML_BOTNAME,
                'Please provide a valid URL',
                ML_PREFIX,
                tribe.id,
                message,
                cmd
              )
              return
            }
            meta.url = newUrl
            await bot.update({ meta: JSON.stringify(meta) })
            await botResponse(
              ML_BOTNAME,
              'URL updated successfully',
              ML_PREFIX,
              tribe.id,
              message,
              cmd
            )
            return
        }
      }
      if (!url || !api_key) {
        const embed = new Sphinx.MessageEmbed()
          .setAuthor(ML_BOTNAME)
          .setDescription('not configured')
          .setOnlyOwner(isAdmin ? true : false)
        message.channel.send({ embed })
        return
      }

      let host_name = config.host_name
      if (!host_name.startsWith('http')) {
        host_name = `https://${host_name}`
      }
      const r = await fetch(`${url}/conversation`, {
        method: 'POST',
        body: JSON.stringify({
          message: message.content,
          webhook: `${host_name}/ml`,
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

      CALLBACKS[j.process_id] = function (msg: string) {
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('ML Bot')
          .setDescription(msg)
          .setOnlyOwner(isAdmin ? true : false)
        // .setOnlyUser(message.member.id)
        message.channel.send({ embed })
      }

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
