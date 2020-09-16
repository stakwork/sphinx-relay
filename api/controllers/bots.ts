import * as path from 'path'
import * as tribes from '../utils/tribes'
import * as crypto from 'crypto'
import { models } from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as network from '../network'
import * as intercept from '../network/intercept'
import {finalAction} from './actions'

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

export async function installBot(chatId:number, bot_json) {
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
  const succeeded = await keysendBotInstall(chatBot)
  if(succeeded) models.ChatBot.create(chatBot)
}

export async function keysendBotInstall(b): Promise<boolean> {
  return await botKeysend(
    constants.message_types.bot_install,
    b.botUuid, b.botMakerPubkey, b.pricePerUse,
  )
}

export async function keysendBotCmd(msg, b): Promise<boolean> {
  return await botKeysend(
    constants.message_types.bot_cmd,
    b.botUuid, b.botMakerPubkey, b.pricePerUse,
    msg.message.content,
    msg.chat.uuid,
  )
}

export async function botKeysend(msg_type, bot_uuid, botmaker_pubkey, price_per_use, content?:string, chat_uuid?:string): Promise<boolean> {
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
      chat: {}
    },
    amt: Math.max(price_per_use || MIN_SATS)
  }
  if(chat_uuid) {
    opts.data.chat = {uuid:chat_uuid}
  }
  try {
    await network.signAndSend(opts)
    return true
  } catch (e) {
    return false
  }
}

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
  // forward to the tribe
  // received the entire action?
  const bot_id = payload.bot_id
  finalAction(payload, bot_id)
}
