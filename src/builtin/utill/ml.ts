import { ChatRecord } from '../../models'
import { botResponse, findBot } from './index'
import * as Sphinx from 'sphinx-bot'
import { ML_BOTNAME } from '../ml'
import { sphinxLogger, logging } from '../../utils/logger'

type ContentKind = 'text' | 'image'
export interface MlMeta {
  url: string
  apiKey: string
  kind: ContentKind
  name: string
}

export async function addUrl(
  botName: string,
  botPrefix: string,
  tribe: ChatRecord,
  messageObj: Sphinx.Message,
  msgArr: string[]
) {
  const cmd = msgArr[1]
  const name = msgArr[2]
  const url = msgArr[3]
  try {
    if (!name || !url) {
      await botResponse(
        botName,
        `Please provide a valid model ${name ? 'url' : 'name'}`,
        botPrefix,
        tribe.id,
        messageObj,
        cmd
      )
      return
    }
    const bot = await findBot({ botPrefix, tribe })
    let metaObj: { [key: string]: MlMeta } = JSON.parse(bot.meta || `{}`)
    const meta = metaObj[name]
    if (!meta) {
      await botResponse(
        botName,
        'Model does not exist',
        botPrefix,
        tribe.id,
        messageObj,
        cmd
      )
      return
    }
    metaObj[name] = { ...meta, url }
    await bot.update({ meta: JSON.stringify(metaObj) })
    await botResponse(
      botName,
      `${name.toUpperCase()} URL updated successfully`,
      botPrefix,
      tribe.id,
      messageObj,
      cmd
    )
    return
  } catch (error) {
    sphinxLogger.error(`Error trying to update URL: ${error}`, logging.Bots)
    await botResponse(
      botName,
      error.message || 'Error trying to update URL',
      botPrefix,
      tribe.id,
      messageObj,
      cmd
    )
    return
  }
}

export async function addApiKey(
  botName: string,
  botPrefix: string,
  tribe: ChatRecord,
  messageObj: Sphinx.Message,
  msgArr: string[]
) {
  const cmd = msgArr[1]
  const name = msgArr[2]
  const apiKey = msgArr[3]
  try {
    if (!name || !apiKey) {
      await botResponse(
        botName,
        `Please provide a valid model ${name ? 'api_key' : 'name'}`,
        botPrefix,
        tribe.id,
        messageObj,
        cmd
      )
      return
    }
    const bot = await findBot({ botPrefix, tribe })
    let metaObj: { [key: string]: MlMeta } = JSON.parse(bot.meta || `{}`)
    const meta = metaObj[name]
    if (!meta) {
      await botResponse(
        botName,
        'Model does not exist',
        botPrefix,
        tribe.id,
        messageObj,
        cmd
      )
      return
    }
    metaObj[name] = { ...meta, apiKey }
    await bot.update({ meta: JSON.stringify(metaObj) })
    await botResponse(
      botName,
      `${name.toUpperCase()} API KEY updated successfully`,
      botPrefix,
      tribe.id,
      messageObj,
      cmd
    )
    return
  } catch (error) {
    sphinxLogger.error(`Error trying to update API KEY: ${error}`, logging.Bots)
    await botResponse(
      botName,
      error.message || `Error trying to update ${name.toUpperCase()} API KEY`,
      botPrefix,
      tribe.id,
      messageObj,
      cmd
    )
    return
  }
}

export async function addKind(
  botName: string,
  botPrefix: string,
  tribe: ChatRecord,
  messageObj: Sphinx.Message,
  msgArray: string[]
) {
  const cmd = msgArray[1]
  const name = msgArray[2]
  const kind = msgArray[3]
  try {
    if (!name || !kind) {
      await botResponse(
        botName,
        `Please provide a valid model ${name ? 'kind' : 'name'}`,
        botPrefix,
        tribe.id,
        messageObj,
        cmd
      )
      return
    }
    if (kind !== 'text' && kind !== 'image') {
      await botResponse(
        botName,
        'Please provide a valid kind (text/image)',
        botPrefix,
        tribe.id,
        messageObj,
        cmd
      )
      return
    }
    const bot = await findBot({ botPrefix, tribe })
    let metaObj: { [key: string]: MlMeta } = JSON.parse(bot.meta || `{}`)
    const meta = metaObj[name]
    if (!meta) {
      await botResponse(
        botName,
        'Model does not exist',
        botPrefix,
        tribe.id,
        messageObj,
        cmd
      )
      return
    }
    metaObj[name] = { ...meta, kind }
    await bot.update({ meta: JSON.stringify(metaObj) })
    await botResponse(
      botName,
      `${name.toUpperCase()} kind updated to ${kind}`,
      botPrefix,
      tribe.id,
      messageObj,
      cmd
    )
    return
  } catch (error) {
    sphinxLogger.error(`Error trying to update kind: ${error}`, logging.Bots)
    await botResponse(
      botName,
      error.message || `Error trying to update ${name.toUpperCase()} kind`,
      botPrefix,
      tribe.id,
      messageObj,
      cmd
    )
    return
  }
}

export function defaultCommand(
  botName: string,
  botPrefix: string,
  message: Sphinx.Message
) {
  const embed = new Sphinx.MessageEmbed()
    .setAuthor(botName)
    .setTitle('Bot Commands:')
    .addFields([
      {
        name: `Add URL to ${botName}`,
        value: `${botPrefix} url {URL}`,
      },
      {
        name: `Add API_KEY to ${botName}`,
        value: `${botPrefix} url {API_KEY}`,
      },
      {
        name: `Set content type`,
        value: `${botPrefix} kind {text/image}`,
      },
    ])
    .setOnlyOwner(true)
  message.channel.send({ embed })
}

export async function addModel(
  botName: string,
  botPrefix: string,
  tribe: ChatRecord,
  messageObject: Sphinx.Message,
  msgArr: string[]
) {
  const cmd = msgArr[1]
  const name = msgArr[2]
  const url = msgArr[3]
  try {
    if (!name) {
      await botResponse(
        botName,
        'Please provide a valid model name',
        botPrefix,
        tribe.id,
        messageObject,
        cmd
      )
      return
    }
    const bot = await findBot({ botPrefix, tribe })
    let metaObj: { [key: string]: MlMeta } = JSON.parse(bot.meta || `{}`)
    const meta = metaObj[name]
    if (meta) {
      await botResponse(
        botName,
        'Model already exist',
        botPrefix,
        tribe.id,
        messageObject,
        cmd
      )
      return
    }
    const newModel: MlMeta = { name, apiKey: '', url: url || '', kind: 'text' }
    metaObj[name] = { ...newModel }
    await bot.update({ meta: JSON.stringify(metaObj) })
    await botResponse(
      botName,
      'New model added successfully',
      botPrefix,
      tribe.id,
      messageObject,
      cmd
    )
    return
  } catch (error) {
    sphinxLogger.error(`error while adding model: ${error}`, logging.Bots)
    await botResponse(
      botName,
      error.message || 'Error occured while adding a model',
      botPrefix,
      tribe.id,
      messageObject,
      cmd
    )
    return
  }
}

export function mlBotResponse(msg: string, message: Sphinx.Message) {
  const embed = new Sphinx.MessageEmbed()
    .setAuthor(ML_BOTNAME)
    .setDescription(msg)
    .setOnlyUser(parseInt(message.member.id || '0'))
  message.channel.send({ embed })
}
