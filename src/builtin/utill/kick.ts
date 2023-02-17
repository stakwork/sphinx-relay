import constants from '../../constants'
import {
  ChatRecord,
  ContactRecord,
  models,
  Message,
  ChatBotRecord,
} from '../../models'
import * as network from '../../network'
import * as timers from '../../utils/timers'

interface KickAction {
  tribe: ChatRecord
  botPrefix: string
  pubkey: string
}

export async function kickChatMember({
  tribe,
  contactId,
  tenant,
  owner,
}: {
  tribe: ChatRecord
  contactId: number
  tenant: number
  owner: ContactRecord
}) {
  // remove user from contactIds
  const contactIds = JSON.parse(tribe.contactIds || '[]')
  const newContactIds = contactIds.filter((cid) => cid !== contactId)
  await tribe.update({ contactIds: JSON.stringify(newContactIds) })

  // remove from ChatMembers
  await models.ChatMember.destroy({
    where: {
      chatId: tribe.id,
      contactId,
      tenant,
    },
  })

  //   Send message
  network.sendMessage({
    chat: {
      ...tribe.dataValues,
      contactIds: JSON.stringify([contactId]), // send only to the guy u kicked
    },
    sender: owner,
    message: {} as Message,
    type: constants.message_types.group_kick,
  })

  // delete all timers for this member
  timers.removeTimersByContactIdChatId(contactId, tribe.id, tenant)
}

export async function addToBlackList({ tribe, botPrefix, pubkey }: KickAction) {
  const bot = (await models.ChatBot.findOne({
    where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
  })) as ChatBotRecord
  const blackList = JSON.parse(bot.meta || '[]')
  if (!blackList.includes(pubkey)) {
    blackList.push(pubkey)
    await bot.update({ meta: JSON.stringify(blackList) })
  }
  return
}

export async function removeFromBlackList({
  tribe,
  botPrefix,
  pubkey,
}: KickAction): Promise<string> {
  const bot = (await models.ChatBot.findOne({
    where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
  })) as ChatBotRecord
  const blackList = JSON.parse(bot.meta || '[]')
  if (blackList.includes(pubkey)) {
    const newBlackList = blackList.filter((pk: string) => pk !== pubkey)
    await bot.update({ meta: JSON.stringify(newBlackList) })
    return 'User removed from blacklist successfully'
  }
  return 'User does not exist in blacklist'
}
