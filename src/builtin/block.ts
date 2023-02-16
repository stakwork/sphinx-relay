import * as Sphinx from 'sphinx-bot'
import { sphinxLogger, logging } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import { ChatBotRecord, ChatRecord, ContactRecord, models } from '../models'
import constants from '../constants'
import { kickChatMember } from './utill/block'
import { determineOwnerOnly } from '../controllers/botapi/hideAndUnhideCommand'

const msg_types = Sphinx.MSG_TYPE

let initted = false
const botPrefix = '/block'

export function init() {
  if (initted) return
  initted = true
  //   const commands = ['hide', 'add', 'remove']
  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    if (message.author?.bot !== botPrefix) return
    const isGroupJoin = message.type === constants.message_types.group_join
    const arr = (message.content && message.content.split(' ')) || []

    if (arr[0] !== botPrefix && !isGroupJoin) return
    // const cmd = arr[1]
    const tribe = (await models.Chat.findOne({
      where: { uuid: message.channel.id },
    })) as ChatRecord

    if (isGroupJoin) {
      try {
        const contactJoining = (await models.Contact.findOne({
          where: { id: message.member.id!, tenant: tribe.tenant },
        })) as ContactRecord

        const bot = (await models.ChatBot.findOne({
          where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
        })) as ChatBotRecord
        const owner = (await models.Contact.findOne({
          where: { id: tribe.tenant, isOwner: true, tenant: tribe.tenant },
        })) as ContactRecord

        const blocked = JSON.parse(bot.meta || '[]')
        if (blocked.includes(contactJoining.publicKey)) {
          await kickChatMember({
            tribe,
            contactId: contactJoining.id,
            tenant: tribe.tenant,
            owner,
          })
          const embed = new Sphinx.MessageEmbed()
            .setAuthor('BlockBot')
            .setDescription(
              `${contactJoining.alias} was blocked from joining your tribe`
            )
            .setOnlyOwner(await determineOwnerOnly(botPrefix, 'add', tribe.id))
          message.channel.send({ embed })
          return
        }
        return
      } catch (error) {
        sphinxLogger.error(`WELCOME BOT ERROR ${error}`, logging.Bots)
        return
      }
    }
    if (arr[0] === botPrefix) {
      const isAdmin = message.member.roles.find((role) => role.name === 'Admin')
      if (!isAdmin) return
    }
  })
}
