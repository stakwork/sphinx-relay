import * as path from 'path'
import * as tribes from '../utils/tribes'
import * as crypto from 'crypto'
import { models } from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as network from '../network'
import * as intercept from '../network/intercept'
import {finalAction} from './actions'
import * as socket from '../utils/socket'

const constants = require(path.join(__dirname, '../../config/constants.json'))

export const getBots = async (req, res) => {
  try {
    const bots = await models.Bot.findAll()
    success(res, {
      bots: bots.map(b => jsonUtils.botToJson(b))
    })
  } catch (e) {
    failure(res, 'no bots')
  }
}

export const createBot = async (req, res) => {
  const { name, webhook, price_per_use, img, description, tags,  } = req.body

  const uuid = await tribes.genSignedTimestamp()
  const newBot = {
    name, uuid, webhook,
    id: crypto.randomBytes(12).toString('hex').toUpperCase(),
    secret: crypto.randomBytes(16).toString('hex').toUpperCase(),
    pricePerUse: price_per_use||0
  }
  try {
    const owner = await models.Contact.findOne({ where: { isOwner: true } })
    const theBot = await models.Bot.create(newBot)
    // post to tribes.sphinx.chat
    tribes.declare_bot({
      uuid,
      owner_pubkey: owner.publicKey,
      price_per_use,
      name: name,
      description: description||'',
      tags: tags||[],
      img: img||'',
      unlisted:false,
      deleted:false,
    })
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

export async function installBot(chat, bot_json) {
  const chatId = chat && chat.id
  const chat_uuid = chat && chat.uuid
  if(!chatId || !chat_uuid) return console.log('no chat id in installBot')

  console.log("=> chat to install bot into", chat)
  const owner = await models.Contact.findOne({ where: { isOwner: true } })
  const isTribeOwner = (owner && owner.publicKey) === (chat && chat.ownerPubkey)
  if(!isTribeOwner) return console.log('=> only tribe owner can install bots')

  const {uuid,owner_pubkey,unique_name,price_per_use} = bot_json
  const chatBot = {
    chatId,
    botPrefix: '/' +unique_name,
    botType: constants.bot_types.remote,
    botUuid: uuid,
    botMakerPubkey: owner_pubkey,
    pricePerUse: price_per_use
  }
  console.log("installBot INSTALL BOT NOW",chatBot)
  const succeeded = await keysendBotInstall(chatBot, chat_uuid)
  if(succeeded) models.ChatBot.create(chatBot)
}

export async function keysendBotInstall(b, chat_uuid:string): Promise<boolean> {
  return await botKeysend(
    constants.message_types.bot_install,
    b.botUuid, b.botMakerPubkey, b.pricePerUse,
    chat_uuid
  )
}

export async function keysendBotCmd(msg, b): Promise<boolean> {
  return await botKeysend(
    constants.message_types.bot_cmd,
    b.botUuid, b.botMakerPubkey, b.pricePerUse,
    msg.chat.uuid,
    msg.message.content,
  )
}

export async function botKeysend(msg_type, bot_uuid, botmaker_pubkey, price_per_use, chat_uuid:string, content?:string): Promise<boolean> {
  const owner = await models.Contact.findOne({ where: { isOwner: true } })
  const MIN_SATS = 3
  const destkey = botmaker_pubkey
  const opts = {
    dest: destkey,
    data: {
      type: msg_type,
      bot_uuid,
      message: {content: content||''},
      sender: {
        pub_key: owner.publicKey,
      },
      chat: {
        uuid:chat_uuid
      }
    },
    amt: Math.max(price_per_use || MIN_SATS)
  }
  try {
    await network.signAndSend(opts)
    return true
  } catch (e) {
    return false
  }
}

/*
=> receiveBotInstall {
  type: 23,
  bot_uuid: 'X1_sGR-WM_e29YL5100WA_P_VeYwvEsXfgc2NUhMzLNrNbWy2BVot9bVHnsXyPVmzoHleCYUn8oyUiDzE89Do1acLu6G',
  message: { content: '', amount: 3 },
  sender: {
    pub_key: '037bac010f84ef785ddc3ade66d008d76d90d80eab6e148c00ea4ba102c07f2e53'
  },
  chat: {}
}
no chat uuid or sender pub key
*/
export async function receiveBotInstall(payload) {
  console.log('=> receiveBotInstall',payload)

  const dat = payload.content || payload
  const sender_pub_key = dat.sender && dat.sender.pub_key
  const bot_uuid = dat.bot_uuid
  const chat_uuid = dat.chat && dat.chat.uuid
  if(!chat_uuid || !sender_pub_key) return console.log('no chat uuid or sender pub key')

  const owner = await models.Contact.findOne({ where: { isOwner: true } })

  const bot = await models.Bot.findOne({where:{
    uuid: bot_uuid
  }})
  if(!bot) return

  const verifiedOwnerPubkey = await tribes.verifySignedTimestamp(bot_uuid)
  if(verifiedOwnerPubkey===owner.publicKey){
    const botMember = {
      botId: bot.id,
      memberPubkey:sender_pub_key,
      tribeUuid:chat_uuid,
      msgCount:0,
    }
    console.log("CREATE bot MEMBER", botMember)
    await models.BotMember.create(botMember)
  }
  
  //- need to pub back MQTT bot_install??
  //- and if the pubkey=the botOwnerPubkey, confirm chatbot?
}

// ONLY FOR BOT MAKER
export async function receiveBotCmd(payload) {
  console.log("=> receiveBotCmd", payload)

  const dat = payload.content || payload
  // const sender_pub_key = dat.sender.pub_key
  const bot_uuid = dat.bot_uuid
  const chat_uuid = dat.chat && dat.chat.uuid
  if(!chat_uuid) return console.log('no chat uuid')
  // const amount = dat.message.amount - check price_per_use

  const bot = await models.Bot.findOne({where:{
    uuid: bot_uuid
  }})
  if(!bot) return

  const botMember = await models.BotMember.findOne({ where:{
    botId: bot.id,
    tribeUuid: chat_uuid,
  }})
  if(!botMember) return

  botMember.update({ msgCount: (botMember||0)+1 })

  console.log('=> post to remote BOT!!!!! bot owner')
	return intercept.postToBotServer(payload, bot)
   // forward to the entire Action back over MQTT
}


export async function receiveBotRes(payload) {
  console.log("=> receiveBotRes", payload)
  const dat = payload.content || payload

  if(!dat.chat || !dat.message || !dat.sender) {
    return console.log('=> receiveBotRes error, no chat||msg||sender')
  }
  const chat_uuid = dat.chat && dat.chat.uuid
  const sender_pub_key =dat.sender.pub_key
  const amount = dat.message.amount
  const msg_uuid = dat.message.uuid||''
  const content = dat.message.content
  const botName = dat.message.bot_name
  if(!chat_uuid) return console.log('=> receiveBotRes Error no chat_uuid')

  const chat = await models.Chat.findOne({where:{uuid:chat_uuid}})
  if(!chat) return console.log('=> receiveBotRes Error no chat')

  const tribeOwnerPubKey = chat && chat.ownerPubkey
  const owner = await models.Contact.findOne({where: {isOwner:true}})
  const isTribeOwner = owner.publicKey===tribeOwnerPubKey
  
  if(isTribeOwner){
    // IF IS TRIBE ADMIN forward to the tribe
    // received the entire action?
    const bot_id = payload.bot_id
    finalAction(payload.message, bot_id)

  } else {
    const theChat = await models.Chat.findOne({where:{
      uuid: chat_uuid
    }})
    if(!chat) return console.log('=> receiveBotRes as sub error no chat')
    var date = new Date();
    date.setMilliseconds(0)
    const sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key } })
    const msg: { [k: string]: any } = {
      chatId: chat.id,
      uuid: msg_uuid,
      type: constants.message_types.bot_res,
      sender: (sender&&sender.id) || 0,
      amount: amount || 0,
      date: date,
      messageContent: content,
      status: constants.statuses.confirmed,
      createdAt: date,
      updatedAt: date,
      senderAlias: botName || 'Bot',
    }
    const message = await models.Message.create(msg)
    socket.sendJson({
      type: 'message',
      response: jsonUtils.messageToJson(message, theChat, owner)
    })
  }
}
