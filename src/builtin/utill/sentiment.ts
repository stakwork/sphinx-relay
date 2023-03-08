import * as Sphinx from 'sphinx-bot'
import { determineOwnerOnly } from '../../controllers/botapi/hideAndUnhideCommand'
import { ChatRecord, models } from '../../models'

interface SentimentMeta {
  threshold: number
  last_result: number
  timer: number
}

export async function botResponse(
  botName: string,
  message: string,
  botPrefix: string,
  tribeId: number,
  botMessage: Sphinx.Message,
  command: string
) {
  const embed = new Sphinx.MessageEmbed()
    .setAuthor(botName)
    .setDescription(message)
    .setOnlyOwner(await determineOwnerOnly(botPrefix, command, tribeId))
  botMessage.channel.send({ embed })
}

export async function threshold(
  botName: string,
  command: string,
  tribe: ChatRecord,
  botPrefix: string,
  message: Sphinx.Message,
  value: string
) {
  const threshold = Number(value)
  if (isNaN(threshold)) {
    return await botResponse(
      botName,
      'Invalid threshold value',
      botPrefix,
      tribe.id,
      message,
      command
    )
  }
  const bot = (await models.ChatBot.findOne({
    where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
  })) as ChatRecord

  let meta: SentimentMeta = JSON.parse(bot.meta || `{}`)
  meta.threshold = threshold
  await bot.update({ meta: JSON.stringify(meta) })
  return await botResponse(
    botName,
    'Threshold updated successfully',
    botPrefix,
    tribe.id,
    message,
    command
  )
}
