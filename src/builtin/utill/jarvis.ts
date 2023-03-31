import { botResponse, findBot } from './'
import * as Sphinx from 'sphinx-bot'
import { ChatBotRecord, ChatRecord } from '../../models'
import { sphinxLogger, logging } from '../../utils/logger'

export interface JarvisMeta {
  url: string
}

interface UpdateLinkInput {
  botPrefix: string
  command: string
  botMessage: Sphinx.Message
  tribe: ChatRecord
  url: string
  isAdmin: boolean
  botName: string
}

export async function updateLink({
  botPrefix,
  command,
  botMessage,
  tribe,
  url,
  isAdmin,
  botName,
}: UpdateLinkInput) {
  try {
    const bot: ChatBotRecord = await findBot({ botPrefix, tribe })
    console.log(bot)
    let meta: JarvisMeta = JSON.parse(bot.meta || `{}`)
    meta.url = url
    await bot.update({ meta: JSON.stringify(meta) })
    const secondBot = await findBot({ botPrefix, tribe })
    console.log(secondBot.dataValues)
    return await botResponse(
      botName,
      'Jarvis link updated successfullt',
      botPrefix,
      tribe.id,
      botMessage,
      command
    )
  } catch (error) {
    sphinxLogger.error([`JARVIS BOT ERROR ${error}`, logging.Bots])
    return await botResponse(
      botName,
      'Error updating link',
      botPrefix,
      tribe.id,
      botMessage,
      command
    )
  }
}
