import * as path from 'path'
import {Msg} from '../network/interfaces'
import * as tribes from '../utils/tribes'
import * as crypto from 'crypto'
import { models } from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import {emit as emitBotMsg} from '../bots'

const constants = require(path.join(__dirname, '../../config/constants.json'))

export const getBots = async (req, res) => {
  try {
      const bots = await models.Bot.findAll()
      success(res, {
          bots: bots.map(b=> jsonUtils.botToJson(b))
      })
  } catch(e) {
      failure(res,'no bots')
  }
}

export const createBot = async (req, res) => {
  const { name, webhook } = req.body

  const uuid = await tribes.genSignedTimestamp()
  const newBot = {
      name, uuid, webhook,
      id: crypto.randomBytes(12).toString('hex').toUpperCase(),
      secret: crypto.randomBytes(16).toString('hex').toUpperCase()
  }
  try {
      const theBot = await models.Bot.create(newBot)
      // post to bots.sphinx.chat
      success(res, jsonUtils.botToJson(theBot))
  } catch (e) {
      failure(res, 'bot creation failed')
  }
}

export const deleteBot = async (req, res) => {
  const id = req.params.id
  if (!id) return
  try {
      models.Bot.destroy({ where: { id } })
      success(res, true)
  } catch (e) {
      console.log('ERROR deleteBot', e)
      failure(res, e)
  }
}

// async function broadcastAction(chat,text){
//   finalAction(<Action>{
//     action:'broadcast',
//     text, chatUUID: chat.uuid,
//     botName:'MotherBot'
//   })
// }

// return bool whether this is legit to process
export async function processBotMessage(msg:Msg, chat, botInTribe): Promise<boolean> {
  console.log('===> PROCESS BOT MSG')
  const txt = msg.message.content
  console.log('===> txt',txt)
  if(txt.startsWith('/bot ')){
    emitBotMsg(txt, chat.uuid)
  } else {

  }
  return true
}

/* intercept */

export function installBot(botname,botInTribe) {
  console.log("INSTALL BOT NOW")
  // search registry for bot (by name)

  // need bot uuid and maker pubkey
  // send bot_install to bot maker

  // generate ChatMember with bot=true
  // bot_maker_pubkey, bot_uuid, bot_prefix
}

export async function receiveBotInstall(payload) {
  console.log('=> receiveBotInstall')
  // const dat = payload.content || payload
  // const sender_pub_key = dat.sender.pub_key
  // const tribe_uuid = dat.chat.uuid
  
  // verify tribe ownership (verify signed timestamp)

  // create BotMember for publishing to mqtt
}

// type BotCmdType = 'install' | 'message' | 'broadcast' | 'keysend'

export async function receiveBotCmd(payload) {
  console.log(constants.message_types.bot_cmd)
}

export async function receiveBotRes(payload) {
  console.log(constants.message_types.bot_res)
}
