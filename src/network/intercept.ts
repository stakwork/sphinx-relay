import { BotMsg } from './interfaces'
import { models, Bot, Chat, ChatRecord, Message } from '../models'

import { builtinBotEmit } from '../builtin'
import { keysendBotCmd, postToBotServer } from '../controllers/bots'
import * as SphinxBot from 'sphinx-bot'
import constants from '../constants'
import { logging, sphinxLogger } from '../utils/logger'

/*
default show or not
restrictions (be able to toggle, or dont show chat)
*/

// return bool whether to skip forwarding to tribe
export async function isBotMsg(
  m: BotMsg,
  sentByMe: boolean,
  sender,
  forwardedFromContactId?: number
): Promise<boolean> {
  const tenant: number = sender.id
  if (!tenant) {
    sphinxLogger.info(`no tenant in isBotMsg`)
    return false
  }

  const msg = JSON.parse(JSON.stringify(m))
  msg.sender.id = forwardedFromContactId || tenant

  // console.log('=> isBotMsg', msg)
  const txt = msg.message && msg.message.content
  const reply_uuid = msg.message && msg.message.replyUuid

  const msgType = msg.type
  if (msgType === constants.message_types.bot_res) {
    return false // bot res msg type not for processing
  }
  const uuid = msg.chat && msg.chat.uuid
  if (!uuid) return false

  try {
    const chat: Chat = (await models.Chat.findOne({
      where: { uuid, tenant },
    })) as Chat
    if (!chat) return false

    let didEmit = false

    if (txt && txt.startsWith('/bot ')) {
      builtinBotEmit(msg)
      didEmit = true
    }
    if (didEmit) return didEmit

    // reply back to the bot!
    if (reply_uuid) {
      const ogBotMsg: Message = (await models.Message.findOne({
        where: {
          uuid: reply_uuid,
          tenant,
          sender: -1,
        },
      })) as Message
      if (ogBotMsg && ogBotMsg.senderAlias) {
        const ogSenderBot: ChatRecord = (await models.ChatBot.findOne({
          where: {
            chatId: chat.id,
            tenant,
            botPrefix: '/' + ogBotMsg.senderAlias,
          },
        })) as ChatRecord
        return await emitMessageToBot(msg, ogSenderBot.dataValues, sender)
      }
    }

    const botsInTribe: Bot[] = (await models.ChatBot.findAll({
      where: {
        chatId: chat.id,
        tenant,
      },
    })) as Bot[]
    sphinxLogger.info(`=> botsInTribe ${botsInTribe.length}`, logging.Network) //, payload)

    const botInterceptMsg = ['/badge', '/callRecording']
    if (!(botsInTribe && botsInTribe.length)) return false

    await asyncForEach(botsInTribe, async (botInTribe) => {
      if (botInTribe.msgTypes) {
        // console.log('=> botInTribe.msgTypes', botInTribe)
        try {
          const msgTypes = JSON.parse(botInTribe.msgTypes)
          if (msgTypes.includes(msgType)) {
            const isMsgAndHasText =
              msgType === constants.message_types.message &&
              txt &&
              txt.startsWith(`${botInTribe.botPrefix} `)
            const isNotMsg = msgType !== constants.message_types.message
            if (
              isMsgAndHasText ||
              isNotMsg ||
              botInterceptMsg.includes(botInTribe.botPrefix)
            ) {
              didEmit = await emitMessageToBot(
                msg,
                botInTribe.dataValues,
                sender
              )
            }
          }
        } catch (e) {
          sphinxLogger.error(`error parsing bots in tribe ${e}`)
          return false
        }
      } else {
        // no message types defined, do all?
        if (txt && txt.startsWith(`${botInTribe.botPrefix} `)) {
          // console.log('=> botInTribe.msgTypes else', botInTribe.dataValues)
          didEmit = await emitMessageToBot(msg, botInTribe.dataValues, sender)
        }
      }
    })

    return didEmit
  } catch (e) {
    sphinxLogger.error(`=> isBotMsg ERROR ${e}`)
    return false
  }
}

async function emitMessageToBot(msg, botInTribe, sender): Promise<boolean> {
  // console.log('=> emitMessageToBot',JSON.stringify(msg,null,2))
  sphinxLogger.info(`=> emitMessageToBot ${msg}`, logging.Network) //, payload)

  const tenant: number = sender.id
  if (!tenant) {
    sphinxLogger.error(`=> no tenant in emitMessageToBot`)
    return false
  }
  switch (botInTribe.botType) {
    case constants.bot_types.builtin:
      builtinBotEmit(msg)
      return true
    case constants.bot_types.local: {
      const bot: Bot = (await models.Bot.findOne({
        where: {
          uuid: botInTribe.botUuid,
          tenant,
        },
      })) as Bot
      return postToBotServer(msg, bot, SphinxBot.MSG_TYPE.MESSAGE)
    }
    case constants.bot_types.remote:
      return keysendBotCmd(msg, botInTribe, sender)
    default:
      return false
  }
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
