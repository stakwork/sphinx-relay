import * as Sphinx from 'sphinx-bot'
import { finalAction } from '../controllers/botapi'
import { ChatRecord, models, ChatBotRecord } from '../models'
import { findBot, botResponse } from './utill'
import { loadConfig } from '../utils/config'
import fetch from 'node-fetch'

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

      const bot: ChatBotRecord = await findBot({ botPrefix: ML_PREFIX, tribe })

      let meta: MlMeta = JSON.parse(bot.meta || `{}`)
      const url = meta.url
      const api_key = meta.apiKey
      const arr = (message.content && message.content.split(' ')) || []
      if (isAdmin && arr[0] === ML_PREFIX) {
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
          case 'api_key':
            const newApiKey = arr[2]
            if (!newApiKey) {
              await botResponse(
                ML_BOTNAME,
                'Please provide a valid API KEY',
                ML_PREFIX,
                tribe.id,
                message,
                cmd
              )
              return
            }
            meta.apiKey = newApiKey
            await bot.update({ meta: JSON.stringify(meta) })
            await botResponse(
              ML_BOTNAME,
              'API KEY updated successfully',
              ML_PREFIX,
              tribe.id,
              message,
              cmd
            )
            return
          default:
            const embed = new Sphinx.MessageEmbed()
              .setAuthor(ML_BOTNAME)
              .setTitle('Bot Commands:')
              .addFields([
                {
                  name: `Add URL to ${ML_BOTNAME}`,
                  value: `${ML_PREFIX} url {URL}`,
                },
                {
                  name: `Add API_KEY to ${ML_BOTNAME}`,
                  value: `${ML_PREFIX} url {API_KEY}`,
                },
              ])
              .setOnlyOwner(true)
            message.channel.send({ embed })
            return
        }
      }
      if (!url || !api_key) {
        const embed = new Sphinx.MessageEmbed()
          .setAuthor(ML_BOTNAME)
          .setDescription('not configured!')
          .setOnlyUser(parseInt(message.member.id || '0'))
        message.channel.send({ embed })
        return
      }

      let host_name = config.host_name
      if (!host_name.startsWith('http')) {
        host_name = `https://${host_name}`
      }
      const r = await fetch(`${url}/send-message-llm`, {
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
          .setOnlyUser(parseInt(message.member.id || '0'))
        message.channel.send({ embed })
        return
      }

      CALLBACKS[j.process_id] = function (msg: string) {
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('ML Bot')
          .setDescription(msg)
          .setOnlyUser(parseInt(message.member.id || '0'))
        message.channel.send({ embed })
      }

      setTimeout(() => {
        delete CALLBACKS[j.process_id]
      }, 5 * 60 * 1000)
    } catch (e) {
      console.error('ML CALL FAILED', e)
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
