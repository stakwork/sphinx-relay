import constants from '../constants'
import { models } from '../models'

export async function createBadgeBot(chatId: number, tenant: number) {
  const badge = await models.ChatBot.findOne({
    where: { tenant, chatId, botPrefix: '/badge' },
  })
  if (!badge) {
    const chatBot: { [k: string]: any } = {
      chatId,
      botPrefix: '/badge',
      botType: constants.bot_types.builtin,
      msgTypes: JSON.stringify([
        constants.message_types.message,
        constants.message_types.boost,
        constants.message_types.direct_payment,
      ]),
      pricePerUse: 0,
      tenant,
    }
    await models.ChatBot.create(chatBot)
  }
}
