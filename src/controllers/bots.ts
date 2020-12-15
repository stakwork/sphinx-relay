import * as tribes from '../utils/tribes'
import * as crypto from 'crypto'
import { models } from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as network from '../network'
import { finalAction, Action } from './api'
import * as socket from '../utils/socket'
import fetch from 'node-fetch'
import * as SphinxBot from 'sphinx-bot'
import { Msg } from '../network/interfaces'
import constants from '../constants'

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
  const { name, webhook, price_per_use, img, description, tags, } = req.body

  const uuid = await tribes.genSignedTimestamp()
  const newBot = {
    name, uuid, webhook,
    id: crypto.randomBytes(12).toString('hex').toUpperCase(),
    secret: crypto.randomBytes(16).toString('hex').toUpperCase(),
    pricePerUse: price_per_use || 0
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
      description: description || '',
      tags: tags || [],
      img: img || '',
      unlisted: false,
      deleted: false,
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

export async function installBotAsTribeAdmin(chat, bot_json) {
  const chatId = chat && chat.id
  const chat_uuid = chat && chat.uuid
  if (!chatId || !chat_uuid) return console.log('no chat id in installBot')

  console.log("=> chat to install bot into", chat.name)
  const owner = await models.Contact.findOne({ where: { isOwner: true } })
  const isTribeOwner = (owner && owner.publicKey) === (chat && chat.ownerPubkey)
  if (!isTribeOwner) return console.log('=> only tribe owner can install bots')

  const { uuid, owner_pubkey, unique_name, price_per_use } = bot_json

  const isLocal = owner_pubkey === owner.publicKey
  let botType = constants.bot_types.remote
  if (isLocal) {
    console.log('=> install local bot now!')
    botType = constants.bot_types.local
  }
  const chatBot = {
    chatId,
    botPrefix: '/' + unique_name,
    botType: botType,
    botUuid: uuid,
    botMakerPubkey: owner_pubkey,
    pricePerUse: price_per_use
  }
  if (isLocal) {
    // "install" my local bot and send "INSTALL" event
    const myBot = await models.Bot.findOne({
      where: {
        uuid: bot_json.uuid
      }
    })
    if (myBot) {
      await models.ChatBot.create(chatBot)
      postToBotServer(<network.Msg>{
        type: constants.message_types.bot_install,
        bot_uuid: myBot.uuid,
        message: { content: '', amount: 0 },
        sender: {
          pub_key: owner.publicKey,
          alias: owner.alias,
          role: constants.chat_roles.owner
        },
        chat: { uuid: chat_uuid }
      }, myBot, SphinxBot.MSG_TYPE.INSTALL)
    }
  } else {
    // keysend to bot maker
    console.log("installBot INSTALL REMOTE BOT NOW", chatBot)
    const succeeded = await keysendBotInstall(chatBot, chat_uuid)
    if (succeeded) {
      try { // could fail
        await models.ChatBot.create(chatBot)
      } catch (e) { }
    }
  }
}

export async function keysendBotInstall(b, chat_uuid: string): Promise<boolean> {
  return await botKeysend(
    constants.message_types.bot_install,
    b.botUuid, b.botMakerPubkey, b.pricePerUse,
    chat_uuid
  )
}

export async function keysendBotCmd(msg, b): Promise<boolean> {
  const amount = msg.message.amount || 0
  const amt = Math.max(amount, b.pricePerUse)
  return await botKeysend(
    constants.message_types.bot_cmd,
    b.botUuid, b.botMakerPubkey, amt,
    msg.chat.uuid,
    msg.message.content,
    (msg.sender && msg.sender.role)
  )
}

export async function botKeysend(msg_type, bot_uuid, botmaker_pubkey, amount, chat_uuid: string, content?: string, sender_role?: number): Promise<boolean> {
  const owner = await models.Contact.findOne({ where: { isOwner: true } })
  const dest = botmaker_pubkey
  const amt = Math.max(amount || constants.min_sat_amount)
  const opts = {
    amt,
    dest,
    data: <network.Msg>{
      type: msg_type,
      bot_uuid,
      chat: { uuid: chat_uuid },
      message: { content: content || '', amount: amt },
      sender: {
        pub_key: owner.publicKey,
        alias: owner.alias,
        role: sender_role || constants.chat_roles.reader
      }
    }
  }
  try {
    await network.signAndSend(opts)
    return true
  } catch (e) {
    return false
  }
}

export async function receiveBotInstall(payload) {
  console.log('=> receiveBotInstall', payload)

  const dat = payload.content || payload
  const sender_pub_key = dat.sender && dat.sender.pub_key
  const bot_uuid = dat.bot_uuid
  const chat_uuid = dat.chat && dat.chat.uuid

  if (!chat_uuid || !sender_pub_key) return console.log('no chat uuid or sender pub key')

  const owner = await models.Contact.findOne({ where: { isOwner: true } })

  const bot = await models.Bot.findOne({
    where: {
      uuid: bot_uuid
    }
  })
  if (!bot) return

  const verifiedOwnerPubkey = await tribes.verifySignedTimestamp(bot_uuid)
  if (verifiedOwnerPubkey === owner.publicKey) {
    const botMember = {
      botId: bot.id,
      memberPubkey: sender_pub_key,
      tribeUuid: chat_uuid,
      msgCount: 0,
    }
    console.log("CREATE bot MEMBER", botMember)
    await models.BotMember.create(botMember)
  }

  //- need to pub back MQTT bot_install??
  //- and if the pubkey=the botOwnerPubkey, confirm chatbot?

  // NO - send a /guildjoin msg to BOT lib!
  // and add routes to lib express with the strings for MSG_TYPE
  // and here - postToBotServer /install (also do this for /uninstall)
  postToBotServer(payload, bot, SphinxBot.MSG_TYPE.INSTALL)
}

// ONLY FOR BOT MAKER
export async function receiveBotCmd(payload) {
  console.log("=> receiveBotCmd", payload)

  const dat = payload.content || payload
  // const sender_pub_key = dat.sender.pub_key
  const bot_uuid = dat.bot_uuid
  const chat_uuid = dat.chat && dat.chat.uuid
  if (!chat_uuid) return console.log('no chat uuid')
  // const amount = dat.message.amount - check price_per_use

  const bot = await models.Bot.findOne({
    where: {
      uuid: bot_uuid
    }
  })
  if (!bot) return

  const botMember = await models.BotMember.findOne({
    where: {
      botId: bot.id,
      tribeUuid: chat_uuid,
    }
  })
  if (!botMember) return

  botMember.update({ msgCount: (botMember || 0) + 1 })

  console.log('=> post to remote BOT!!!!! bot owner')
  postToBotServer(payload, bot, SphinxBot.MSG_TYPE.MESSAGE)
  // forward to the entire Action back over MQTT
}

export async function postToBotServer(msg, bot, route: string): Promise<boolean> {
  if (!bot) return false
  if (!bot.webhook || !bot.secret) return false
  let url = bot.webhook
  if (url.charAt(url.length - 1) === '/') {
    url += route
  } else {
    url += ('/' + route)
  }
  const r = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(
      buildBotPayload(msg)
    ),
    headers: {
      'x-secret': bot.secret,
      'Content-Type': 'application/json'
    }
  })
  return r.ok
}

export function buildBotPayload(msg: Msg): SphinxBot.Message {
  const chat_uuid = msg.chat && msg.chat.uuid
  const m = <SphinxBot.Message>{
    channel: {
      id: chat_uuid,
      send: function () { },
    },
    reply: function () { },
    content: msg.message.content,
    amount: msg.message.amount,
    type: msg.type,
    member: {
      id: msg.sender.pub_key,
      nickname: msg.sender.alias,
      roles: []
    }
  }
  if (msg.sender.role === constants.chat_roles.owner) {
    if (m.member) m.member.roles = [{
      name: 'Admin'
    }]
  }
  return m
}

export async function receiveBotRes(payload) {
  console.log("=> receiveBotRes")//, payload)
  const dat = payload.content || payload

  if (!dat.chat || !dat.message || !dat.sender) {
    return console.log('=> receiveBotRes error, no chat||msg||sender')
  }
  const chat_uuid = dat.chat && dat.chat.uuid
  const sender_pub_key = dat.sender.pub_key
  const amount = dat.message.amount || 0
  const msg_uuid = dat.message.uuid || ''
  const content = dat.message.content
  const action = dat.action
  const bot_name = dat.bot_name
  const sender_alias = dat.sender.alias
  const sender_pic = dat.sender_photo_url
  const date_string = dat.message.date
  const network_type = dat.network_type || 0

  if (!chat_uuid) return console.log('=> receiveBotRes Error no chat_uuid')

  const chat = await models.Chat.findOne({ where: { uuid: chat_uuid } })
  if (!chat) return console.log('=> receiveBotRes Error no chat')

  const tribeOwnerPubKey = chat && chat.ownerPubkey
  const owner = await models.Contact.findOne({ where: { isOwner: true } })
  const isTribeOwner = owner.publicKey === tribeOwnerPubKey

  if (isTribeOwner) {
    console.log("=> is tribeOwner, do finalAction!")
    // IF IS TRIBE ADMIN forward to the tribe
    // received the entire action?
    const bot_id = payload.bot_id
    finalAction(<Action>{
      action, bot_name, chat_uuid, content, amount,
    }, bot_id)

  } else {
    const theChat = await models.Chat.findOne({
      where: {
        uuid: chat_uuid
      }
    })
    if (!chat) return console.log('=> receiveBotRes as sub error no chat')
    var date = new Date();
    date.setMilliseconds(0)
    if (date_string) date = new Date(date_string)

    const sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key } })
    const msg: { [k: string]: any } = {
      chatId: chat.id,
      uuid: msg_uuid,
      type: constants.message_types.bot_res,
      sender: (sender && sender.id) || 0,
      amount: amount || 0,
      date: date,
      messageContent: content,
      status: constants.statuses.confirmed,
      createdAt: date,
      updatedAt: date,
      senderAlias: sender_alias || 'Bot',
      senderPic: sender_pic,
      network_type
    }
    const message = await models.Message.create(msg)
    socket.sendJson({
      type: 'message',
      response: jsonUtils.messageToJson(message, theChat, owner)
    })
  }
}
