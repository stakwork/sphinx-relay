import * as Sphinx from 'sphinx-bot'
import { determineOwnerOnly } from '../../controllers/botapi/hideAndUnhideCommand'
import { ChatBotRecord, ChatRecord, models } from '../../models'

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

export async function findBot({
  botPrefix,
  tribe,
}: {
  botPrefix: string
  tribe: ChatRecord
}): Promise<ChatBotRecord> {
  try {
    const bot = (await models.ChatBot.findOne({
      where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
    })) as ChatBotRecord
    return bot
  } catch (error) {
    throw error
  }
}
