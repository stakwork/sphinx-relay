import * as Sphinx from 'sphinx-bot'
import { sphinxLogger, logging } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import {
  ChatBotRecord,
  ChatMemberRecord,
  ChatRecord,
  ContactRecord,
  models,
} from '../models'
import constants from '../constants'
import { kickChatMember, addToBlockedList } from './utill/block'
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
    const cmd = arr[1]

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
      switch (cmd) {
        case 'add':
          const pubkey = arr[2]
          if (pubkey.length !== 66) {
            const embed = new Sphinx.MessageEmbed()
              .setAuthor('BlockBot')
              .setDescription(`Invalid Public key`)
              .setOnlyOwner(await determineOwnerOnly(botPrefix, cmd, tribe.id))
            message.channel.send({ embed })
            return
          }
          const contact = (await models.Contact.findOne({
            where: { publicKey: pubkey, tenant: tribe.tenant },
          })) as ContactRecord
          if (contact) {
            const isChatMember = (await models.ChatMember.findOne({
              where: {
                chatId: tribe.id,
                tenant: tribe.tenant,
                contactId: contact.id,
              },
            })) as ChatMemberRecord
            if (isChatMember) {
              const owner = (await models.Contact.findOne({
                where: {
                  id: tribe.tenant,
                  isOwner: true,
                  tenant: tribe.tenant,
                },
              })) as ContactRecord
              await kickChatMember({
                tribe,
                contactId: contact.id,
                tenant: tribe.tenant,
                owner: owner,
              })
              await addToBlockedList({ tribe, botPrefix, pubkey })
              const embed = new Sphinx.MessageEmbed()
                .setAuthor('BlockBot')
                .setDescription(
                  `You've successfully kicked the user out of this tribe and added him to the blocked list`
                )
                .setOnlyOwner(
                  await determineOwnerOnly(botPrefix, cmd, tribe.id)
                )
              message.channel.send({ embed })
              return
            }
          }
          await addToBlockedList({ tribe, botPrefix, pubkey })
          const resEmbed = new Sphinx.MessageEmbed()
            .setAuthor('BlockBot')
            .setDescription(
              `You've successfully added this user to the blocked list`
            )
          message.channel.send({ embed: resEmbed })
          return
        default:
          const embed = new Sphinx.MessageEmbed()
            .setAuthor('BlockBot')
            .setTitle('Bot Commands:')
            .addFields([
              {
                name: 'Add User Pubkey to block',
                value: '/block add ${public_key}',
              },
              {
                name: 'Remove User Pubkey from block list',
                value: '/block remove ${public_key}',
              },
              { name: 'Help', value: '/welcome help' },
            ])
            .setThumbnail(botSVG)
          message.channel.send({ embed })
          return
      }
    }
  })
}

const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`
