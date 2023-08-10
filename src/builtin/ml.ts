import * as Sphinx from 'sphinx-bot'
import { finalAction } from '../controllers/botapi'
import { ChatRecord, models, ChatBotRecord } from '../models'
import { findBot } from './utill'
import { loadConfig } from '../utils/config'
import fetch from 'node-fetch'
import {
  MlMeta,
  addUrl,
  addApiKey,
  addKind,
  defaultCommand,
  mlBotResponse,
} from './utill/ml'

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
      meta.kind = meta.kind || 'text'
      const url = meta.url
      const api_key = meta.apiKey
      const arr = (message.content && message.content.split(' ')) || []

      if (isAdmin && arr[0] === ML_PREFIX) {
        const cmd = arr[1]

        switch (cmd) {
          case 'url':
            const newUrl = arr[2]
            await addUrl(
              bot,
              meta,
              ML_BOTNAME,
              ML_PREFIX,
              tribe,
              cmd,
              message,
              newUrl
            )
            return
          case 'api_key':
            const newApiKey = arr[2]
            await addApiKey(
              bot,
              meta,
              ML_BOTNAME,
              ML_PREFIX,
              tribe,
              cmd,
              message,
              newApiKey
            )
            return
          case 'kind':
            const newKind = arr[2]
            await addKind(
              bot,
              meta,
              ML_BOTNAME,
              ML_PREFIX,
              tribe,
              cmd,
              message,
              newKind
            )
            return
          default:
            defaultCommand(ML_BOTNAME, ML_PREFIX, message)
            return
        }
      }
      if (!url || !api_key) {
        mlBotResponse('not configured!', message)
        return
      }

      let host_name = config.host_name
      if (!host_name.startsWith('http')) {
        host_name = `https://${host_name}`
      }

      const r = await fetch(url, {
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

      if (!j.body) {
        mlBotResponse('failed to process message (no body)', message)
        return
      }
      let process_id = j.body && j.body.process_id
      if (!process_id) {
        mlBotResponse('failed to process message', message)
        return
      }

      CALLBACKS[process_id] = function (msg: string) {
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('ML Bot')
          .setOnlyUser(parseInt(message.member.id || '0'))
        if (meta.kind === 'text') {
          embed.setDescription(msg)
        }
        if (meta.kind === 'image') {
          embed.setImage(msg)
        }
        message.channel.send({ embed })
        delete CALLBACKS[process_id]
      }

      setTimeout(() => {
        delete CALLBACKS[process_id]
      }, 5 * 60 * 1000)
    } catch (e) {
      console.error('ML CALL FAILED', e)
    }
  })
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
