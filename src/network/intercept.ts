import { Msg } from './interfaces'
import { models } from '../models'
import { builtinBotEmit } from '../builtin'
import { keysendBotCmd, postToBotServer } from '../controllers/bots'
import * as SphinxBot from 'sphinx-bot'
import constants from '../constants'

/*
default show or not
restrictions (be able to toggle, or dont show chat)
*/

// return bool whether to skip forwarding to tribe
export async function isBotMsg(msg: Msg, sentByMe: boolean): Promise<boolean> {
  console.log('=> is bot msg')
  const txt = msg.message && msg.message.content

  const msgType = msg.type
  if (msgType === constants.message_types.bot_res) {
    return false // bot res msg type not for processing
  }
  console.log('=> is bot msg 2')
  const uuid = msg.chat && msg.chat.uuid
  if(!uuid) return false
  
  console.log('=> is bot msg 3')
  const chat = await models.Chat.findOne({
    where: {uuid}
  })
  if (!chat) return false

  let didEmit = false

  console.log('=> is bot msg 4')
  if (txt && txt.startsWith('/bot ')) {
    builtinBotEmit(msg)
    didEmit = true
  }
  if (didEmit) return didEmit

  console.log('=> is bot msg 5')
  const botsInTribe = await models.ChatBot.findAll({
    where: {
      chatId: chat.id
    }
  })
  // console.log('=> botsInTribe', botsInTribe)

  if (!(botsInTribe && botsInTribe.length)) return false

  console.log('=> is bot msg 6')
  await asyncForEach(botsInTribe, async botInTribe => {
    if (botInTribe.msgTypes) {
      // console.log('=> botInTribe.msgTypes', botInTribe)
      try {
        const msgTypes = JSON.parse(botInTribe.msgTypes)
        if (msgTypes.includes(msgType)) {
          const isMsgAndHasText = msgType === constants.message_types.message && txt && txt.startsWith(`${botInTribe.botPrefix} `)
          const isNotMsg = msgType !== constants.message_types.message
          if (isMsgAndHasText || isNotMsg) {
            console.log('=> is bot msg emitMessageToBot',msg,botInTribe.dataValues)
            didEmit = await emitMessageToBot(msg, botInTribe.dataValues)
          }
        }
      } catch (e) { }
    } else { // no message types defined, do all?
      if (txt && txt.startsWith(`${botInTribe.botPrefix} `)) {
        console.log('=> is bot msg emitMessageToBot2',msg,botInTribe.dataValues)
        // console.log('=> botInTribe.msgTypes else', botInTribe.dataValues)
        didEmit = await emitMessageToBot(msg, botInTribe.dataValues)
      }
    }
  })

  return didEmit
}

async function emitMessageToBot(msg, botInTribe): Promise<boolean> {
  // console.log('=> emitMessageToBot',JSON.stringify(msg,null,2))
  switch (botInTribe.botType) {
    case constants.bot_types.builtin:
      builtinBotEmit(msg)
      return true
    case constants.bot_types.local:
      const bot = await models.Bot.findOne({
        where: {
          uuid: botInTribe.botUuid
        }
      })
      return postToBotServer(msg, bot, SphinxBot.MSG_TYPE.MESSAGE)
    case constants.bot_types.remote:
      return keysendBotCmd(msg, botInTribe)
    default:
      return false
  }
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}