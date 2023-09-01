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
  addModel,
  getAttachmentBlob,
  getOgMessage,
} from './utill/ml'
import { sphinxLogger, logging } from '../utils/logger'
import constants from '../constants'
import * as rsa from '../crypto/rsa'

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

      const arr = (message.content && message.content.split(' ')) || []

      if (isAdmin && arr[0] === ML_PREFIX) {
        const cmd = arr[1]

        switch (cmd) {
          case 'url':
            await addUrl(ML_BOTNAME, ML_PREFIX, tribe, message, arr)
            return
          case 'api_key':
            await addApiKey(ML_BOTNAME, ML_PREFIX, tribe, message, arr)
            return
          case 'kind':
            await addKind(ML_BOTNAME, ML_PREFIX, tribe, message, arr)
            return
          case 'add':
            await addModel(ML_BOTNAME, ML_PREFIX, tribe, message, arr)
            return
          default:
            defaultCommand(ML_BOTNAME, ML_PREFIX, message)
            return
        }
      }
      let imageBase64 = ''
      let imageUrl = ''
      if (message.reply_id) {
        //Look for original message
        const ogMessage = await getOgMessage(message.reply_id, tribe.tenant)
        const parsedRemoteMessage = JSON.parse(ogMessage.remoteMessageContent)

        //Decrypt message
        const decryptedMessage = rsa.decrypt(
          tribe.groupPrivateKey,
          parsedRemoteMessage.chat
        )

        //Check if message has img tag
        const splittedMessage = decryptedMessage.split('<img src=')
        if (splittedMessage.length > 1) {
          const secondSplitting =
            splittedMessage[1] && splittedMessage[1]?.split('"')
          imageUrl = secondSplitting[1]
        }
      }

      if (message.type === constants.message_types.attachment) {
        const blob = await getAttachmentBlob(
          message.media_token!,
          message.media_key!,
          message.media_type!,
          tribe
        )
        imageBase64 = blob.toString('base64')
      }
      const bot: ChatBotRecord = await findBot({ botPrefix: ML_PREFIX, tribe })

      let metaObj: { [key: string]: MlMeta } = JSON.parse(bot.meta || `{}`)
      const modelsArr = Object.keys(metaObj)
      if (modelsArr.length === 0) {
        mlBotResponse('No model added yet!', message)
        return
      }
      let meta: MlMeta
      let content = ''
      if (modelsArr.length === 1) {
        meta = metaObj[modelsArr[0]]
        if (message.content.startsWith(`@${modelsArr[0]}`)) {
          content = message.content.substring(modelsArr[0].length + 1)
        } else {
          content = message.content
        }
      } else {
        let modelName = ''
        if (message.content && message.content.startsWith('@')) {
          modelName = message.content.substring(
            1,
            message.content.indexOf(' ') > 0
              ? message.content.indexOf(' ')
              : 100
          )
          content = message.content.substring(modelName.length + 1)
        } else {
          mlBotResponse(
            'Specify model name by typing the @ sysmbol followed by model name immediately, without space',
            message
          )
          return
        }

        meta = metaObj[modelName]
        if (!meta) {
          mlBotResponse('Please provide a valid model name', message)
          return
        }
      }
      const url = meta.url
      const api_key = meta.apiKey

      if (!url || !api_key) {
        mlBotResponse('not configured!', message)
        return
      }

      let host_name = config.host_name
      if (!host_name) {
        mlBotResponse('no host_name!', message)
        return
      }
      if (!host_name.startsWith('http')) {
        host_name = `https://${host_name}`
      }

      const r = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          message: content.trim(),
          image64: imageBase64 || '',
          image_url: imageUrl || '',
          webhook: `${host_name}/ml`,
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
      let j = await r.json()

      if (!j.body) {
        mlBotResponse('failed to process message (no body)', message)
        return
      }
      let process_id = j.body && j.body.process_id
      if (!process_id) {
        mlBotResponse('failed to process message', message)
        return
      }

      mlBotResponse(
        'Message received... estimated response time 30 seconds',
        message
      )

      console.log('ML req sent!', j.body)
      CALLBACKS[process_id] = function (msg: string) {
        const embed = new Sphinx.MessageEmbed()
          .setAuthor(ML_BOTNAME)
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
      console.log(e)
      sphinxLogger.error(`ML CALL FAILED: ${e}`, logging.Bots)
    }
  })
}
