import * as tribes from '../utils/tribes'
import * as crypto from 'crypto'
import { models, Message, Contact, Chat, Bot, BotMember } from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as network from '../network'
import { finalAction, Action } from './botapi'
import * as socket from '../utils/socket'
import fetch from 'node-fetch'
import * as SphinxBot from 'sphinx-bot'
import { BotMsg, Payload } from '../network/interfaces'
import constants from '../constants'
import { logging, sphinxLogger } from '../utils/logger'
import * as short from 'short-uuid'
import { Req, Res } from '../types'
import { updateGitBotPat } from '../builtin/git'
import * as rsa from '../crypto/rsa'
import { getTransportKey } from '../utils/cert'

/**

    getBots retrieves all the bots of a user
    @param req - Express request object
    @param res - Express response object
    @returns void
    */
export const getBots = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  try {
    const bots: Bot[] = (await models.Bot.findAll({
      where: { tenant },
    })) as Bot[]
    success(res, {
      bots: bots.map((b) => jsonUtils.botToJson(b)),
    })
  } catch (e) {
    failure(res, 'no bots')
  }
}

/**

    This function creates a bot and posts it to the tribes.sphinx.chat site.
    @param req.owner - The user creating the bot
    @param req.body.name - The name of the bot
    @param req.body.webhook - The webhook for the bot
    @param req.body.price_per_use - The price per use for the bot
    @param req.body.img - The image of the bot
    @param req.body.description - The description of the bot
    @param req.body.tags - The tags for the bot
    @param res - The response object
    */
export const createBot = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { name, webhook, price_per_use, img, description, tags } = req.body

  const uuid = await tribes.genSignedTimestamp(req.owner.publicKey)
  const newBot = {
    name,
    uuid,
    webhook,
    id: crypto.randomBytes(12).toString('hex').toUpperCase(),
    secret: crypto.randomBytes(16).toString('hex').toUpperCase(),
    pricePerUse: price_per_use || 0,
    tenant,
  }
  try {
    const theBot: Bot = (await models.Bot.create(newBot)) as Bot
    // post to tribes.sphinx.chat
    tribes.declare_bot({
      uuid,
      owner_pubkey: req.owner.publicKey,
      price_per_use,
      name: name,
      description: description || '',
      tags: tags || [],
      img: img || '',
      unlisted: false,
      deleted: false,
      owner_route_hint: req.owner.routeHint || '',
      owner_alias: req.owner.alias || '',
    })
    success(res, jsonUtils.botToJson(theBot))
  } catch (e) {
    failure(res, 'bot creation failed')
  }
}

/**

    Deletes a bot with the given ID.
    @param {Req} req - Express request object.
    @param {Res} res - Express response object.
    @returns {Promise<void>}
    */
export const deleteBot = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const id = req.params.id
  const owner_pubkey = req.owner.publicKey
  if (!id || owner_pubkey) return
  try {
    const bot: Bot = (await models.Bot.findOne({
      where: { id, tenant },
    })) as Bot
    await tribes.delete_bot({
      uuid: bot.uuid,
      owner_pubkey,
    })
    await models.Bot.destroy({ where: { id, tenant } })
    success(res, true)
  } catch (e) {
    sphinxLogger.error(['ERROR deleteBot', e])
    failure(res, e)
  }
}

/**

    Installs a bot into a chat.
    @param {Object} chat - The chat object where the bot will be installed.
    @param {Object} bot_json - The bot information, including the bot's UUID, owner public key, unique name, price per use, and owner route hint.
    @returns {Promise<void>} - Returns a promise that resolves when the bot is successfully installed.
    */
export async function installBotAsTribeAdmin(chat, bot_json): Promise<void> {
  const chatId = chat && chat.id
  const chat_uuid = chat && chat.uuid
  const tenant = chat.tenant
  if (!chatId || !chat_uuid || !tenant)
    return sphinxLogger.error('no chat id in installBot')

  sphinxLogger.info(['=> chat to install bot into', chat.name])
  const owner: Contact = (await models.Contact.findOne({
    where: { id: tenant },
  })) as Contact
  if (!owner)
    return sphinxLogger.error('cant find owner in installBotAsTribeAdmin')
  const isTribeOwner = (owner && owner.publicKey) === (chat && chat.ownerPubkey)
  if (!isTribeOwner)
    return sphinxLogger.error('=> only tribe owner can install bots')

  const { uuid, owner_pubkey, unique_name, price_per_use, owner_route_hint } =
    bot_json

  const isLocal = owner_pubkey === owner.publicKey
  let botType = constants.bot_types.remote
  if (isLocal) {
    sphinxLogger.info('=> install local bot now!')
    botType = constants.bot_types.local
  }
  const chatBot = {
    chatId,
    botPrefix: '/' + unique_name,
    botType: botType,
    botUuid: uuid,
    botMakerPubkey: owner_pubkey,
    botMakerRouteHint: owner_route_hint || '',
    pricePerUse: price_per_use,
    tenant,
  }
  if (isLocal) {
    // "install" my local bot and send "INSTALL" event
    const myBot: Bot = (await models.Bot.findOne({
      where: {
        uuid: bot_json.uuid,
        tenant,
      },
    })) as Bot
    if (myBot) {
      const success = await postToBotServer(
        <BotMsg>{
          type: constants.message_types.bot_install,
          bot_uuid: myBot.uuid,
          message: { content: '', amount: 0, uuid: short.generate() },
          sender: {
            id: owner.id,
            pub_key: owner.publicKey,
            alias: owner.alias,
            role: constants.chat_roles.owner,
          },
          chat: { uuid: chat_uuid },
        },
        myBot,
        SphinxBot.MSG_TYPE.INSTALL
      )
      if (success) await models.ChatBot.create(chatBot)
    }
  } else {
    // keysend to bot maker
    sphinxLogger.info(['installBot INSTALL REMOTE BOT NOW', chatBot])
    const succeeded = await keysendBotInstall(chatBot, chat_uuid, owner)
    if (succeeded) {
      try {
        // could fail
        await models.ChatBot.create(chatBot)
      } catch (e) {
        //We want to do nothing here
      }
    }
  }
}

/**
 * Sends a keysend to the bot maker to install the bot in a chat.
 *
 * @param {Object} b - The ChatBot object containing information about the bot to be installed.
 * @param {string} chat_uuid - The UUID of the chat where the bot will be installed.
 * @param {Object} owner - The Contact object for the owner of the chat where the bot will be installed.
 * @returns {boolean} - True if the keysend was successful, false otherwise.
 */
export async function keysendBotInstall(
  b,
  chat_uuid: string,
  owner
): Promise<boolean> {
  return await botKeysend(
    constants.message_types.bot_install,
    b.botUuid,
    b.botMakerPubkey,
    b.pricePerUse,
    chat_uuid,
    owner,
    b.botMakerRouteHint
  )
}

/**
 * Sends a keysend to a bot maker.
 * @param {string} msgType The type of message being sent to the bot maker.
 * @param {string} botUuid The UUID of the bot.
 * @param {string} botMakerPubkey The public key of the bot maker.
 * @param {number} amount The amount to keysend to the bot maker.
 * @param {string} chatUuid The UUID of the chat the bot is being used in.
 * @param {Object} sender The sender of the message.
 * @param {string} botMakerRouteHint The route hint of the bot maker.
 * @param {Object} [msg] The original message being sent to the bot.
 * @returns {Promise<boolean>} Whether the keysend was successful.
 */
export async function keysendBotCmd(msg, b, sender): Promise<boolean> {
  const amount = msg.message.amount || 0
  const amt = Math.max(amount, b.pricePerUse)
  return await botKeysend(
    constants.message_types.bot_cmd,
    b.botUuid,
    b.botMakerPubkey,
    amt,
    msg.chat.uuid,
    sender,
    b.botMakerRouteHint,
    msg
  )
}

/**

    Sends a keysend message to the bot maker with the given parameters.
    @param {string} msg_type - The type of the message to be sent.
    @param {string} bot_uuid - The UUID of the bot.
    @param {string} botmaker_pubkey - The public key of the bot maker.
    @param {number} amount - The amount of the keysend message.
    @param {string} chat_uuid - The UUID of the chat.
    @param {Object} sender - The sender of the keysend message.
    @param {string} botmaker_route_hint - The route hint of the bot maker.
    @param {Object} msg - The message to be sent.
    @return {Promise<boolean>} - Returns a promise that resolves to a boolean indicating whether the keysend message was sent successfully.
    */
export async function botKeysend(
  msg_type,
  bot_uuid,
  botmaker_pubkey,
  amount,
  chat_uuid: string,
  sender,
  botmaker_route_hint?: string,
  msg?: BotMsg
): Promise<boolean> {
  const content = (msg && msg.message.content) || ''
  const sender_role =
    (msg && msg.sender && msg.sender.role) || constants.chat_roles.reader
  const msg_uuid = (msg && msg.message.uuid) || short.generate()

  const sender_id = (msg && msg.sender && msg.sender.id) || sender.id
  const reply_uuid = msg && msg.message.replyUuid
  const parent_id = msg && msg.message.parentId

  const dest = botmaker_pubkey
  const amt = Math.max(amount || constants.min_sat_amount)
  const opts = {
    amt,
    dest,
    route_hint: botmaker_route_hint,
    data: <BotMsg>{
      type: msg_type,
      bot_uuid,
      chat: { uuid: chat_uuid },
      message: {
        content: content,
        amount: amt,
        uuid: msg_uuid,
      },
      sender: {
        pub_key: sender.publicKey,
        alias: sender.alias,
        role: sender_role,
        route_hint: sender.routeHint || '',
      },
    },
  }
  if (sender_id) {
    opts.data.sender.id = sender_id
  }
  if (reply_uuid) {
    opts.data.message.replyUuid = reply_uuid
  }
  if (parent_id) {
    opts.data.message.parentId = parent_id
  }
  sphinxLogger.info(['BOT MSG TO SEND!!!', opts.data])

  try {
    await network.signAndSend(opts, sender)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Receive and process an installation request for a bot.
 *
 * @param {Object} dat - The payload data of the installation request.
 * @param {Object} dat.sender - The sender of the installation request.
 * @param {string} dat.sender.pub_key - The public key of the sender.
 * @param {string} dat.bot_uuid - The UUID of the bot being installed.
 * @param {Object} dat.chat - The chat where the bot is being installed.
 * @param {string} dat.chat.uuid - The UUID of the chat.
 * @param {Object} dat.owner - The owner of the bot.
 * @param {number} dat.owner.id - The ID of the owner.
 */
export async function receiveBotInstall(dat: Payload): Promise<void> {
  sphinxLogger.info(['=> receiveBotInstall', dat], logging.Network)

  const sender_pub_key = dat.sender && dat.sender.pub_key
  const bot_uuid = dat.bot_uuid
  const chat_uuid = dat.chat && dat.chat.uuid
  const owner = dat.owner
  const tenant: number = owner.id

  if (!chat_uuid || !sender_pub_key || !bot_uuid)
    return sphinxLogger.info('=> no chat uuid or sender pub key or bot_uuid')

  const bot: Bot = (await models.Bot.findOne({
    where: {
      uuid: bot_uuid,
      tenant,
    },
  })) as Bot
  if (!bot) return

  const verifiedOwnerPubkey = await tribes.verifySignedTimestamp(bot_uuid)
  if (verifiedOwnerPubkey === owner.publicKey) {
    const botMember = {
      botId: bot.id,
      memberPubkey: sender_pub_key,
      tribeUuid: chat_uuid,
      msgCount: 0,
      tenant,
    }
    sphinxLogger.info(['CREATE bot MEMBER', botMember])
    await models.BotMember.create(botMember)
  }

  const contact: Contact = (await models.Contact.findOne({
    where: {
      tenant,
      publicKey: sender_pub_key,
    },
  })) as Contact
  if (!contact) {
    return sphinxLogger.error('=> receiveBotInstall no contact')
  }

  // sender id needs to be in the msg
  dat.sender.id = contact.id || 0
  postToBotServer(dat, bot, SphinxBot.MSG_TYPE.INSTALL)
}

/**
 * Handle a request to install a bot in a chat.
 *
 * @param {Object} dat - Payload object containing details of the bot and chat to be installed.
 * @param {string} dat.bot_uuid - UUID of the bot to be installed.
 * @param {string} dat.chat.uuid - UUID of the chat in which to install the bot.
 * @param {Object} dat.owner - Object containing details of the owner of the bot.
 * @param {number} dat.owner.id - ID of the owner of the bot.
 * @param {string} dat.sender.pub_key - Public key of the sender of the installation request.
 */
// ONLY FOR BOT MAKER
export async function receiveBotCmd(dat: Payload): Promise<void> {
  sphinxLogger.info('=> receiveBotCmd', logging.Network)

  const sender_pub_key = dat.sender.pub_key
  const bot_uuid = dat.bot_uuid
  const chat_uuid = dat.chat && dat.chat.uuid
  const sender_id = dat.sender && dat.sender.id
  const owner = dat.owner
  const tenant: number = owner.id
  if (!chat_uuid || !bot_uuid) return sphinxLogger.error('no chat uuid')
  // const amount = dat.message.amount - check price_per_use

  const bot: Bot = (await models.Bot.findOne({
    where: {
      uuid: bot_uuid,
      tenant,
    },
  })) as Bot
  if (!bot) return

  const botMember: BotMember = (await models.BotMember.findOne({
    where: {
      botId: bot.id,
      tribeUuid: chat_uuid,
      tenant,
    },
  })) as BotMember
  if (!botMember) return

  botMember.update({ msgCount: (botMember.msgCount || 0) + 1 })

  const contact: Contact = (await models.Contact.findOne({
    where: {
      tenant,
      publicKey: sender_pub_key,
    },
  })) as Contact
  if (!contact) {
    return sphinxLogger.error('=> receiveBotInstall no contact')
  }

  // sender id needs to be in the msg
  dat.sender.id = sender_id || 0

  postToBotServer(dat, bot, SphinxBot.MSG_TYPE.MESSAGE)
  // forward to the entire Action back over MQTT
}

/**
 * Sends a request to the bot's webhook with a given message.
 *
 * @param {object} msg - The message to send to the bot.
 * @param {object} bot - The bot to which the message will be sent.
 * @param {string} route - The route to the bot's webhook.
 * @return {boolean} - Whether the request was successful.
 */
export async function postToBotServer(
  msg,
  bot,
  route: string
): Promise<boolean> {
  sphinxLogger.info('=> postToBotServer', logging.Network) //, payload)
  if (!bot) {
    sphinxLogger.info('=> no bot', logging.Network) //, payload)
    return false
  }
  if (!bot.webhook || !bot.secret) {
    sphinxLogger.info('=> no bot webook or secret', logging.Network) //, payload)
    return false
  }
  let url = bot.webhook
  if (url.charAt(url.length - 1) === '/') {
    url += route
  } else {
    url += '/' + route
  }
  try {
    const r = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(buildBotPayload(msg)),
      headers: {
        'x-secret': bot.secret,
        'Content-Type': 'application/json',
      },
    })
    sphinxLogger.info(['=> bot post:', r.status], logging.Network)
    return r.ok
  } catch (e) {
    sphinxLogger.error(['=> bot post failed', e], logging.Network)
    return false
  }
}

/**
 * Creates a SphinxBot message from the given `BotMsg`.
 *
 * @param {BotMsg} msg The BotMsg to convert to a SphinxBot message.
 * @returns {SphinxBot.Message} The created SphinxBot message.
 */
export function buildBotPayload(msg: BotMsg): SphinxBot.Message {
  const chat_uuid = msg.chat && msg.chat.uuid
  const m = <SphinxBot.Message>{
    id: msg.message.uuid,
    reply_id: msg.message.replyUuid,
    channel: {
      id: chat_uuid,
      send: function () {},
      pay: function () {},
    },
    content: msg.message.content,
    amount: msg.message.amount,
    type: msg.type,
    member: {
      id: msg.sender.id ? msg.sender.id + '' : '0',
      nickname: msg.sender.alias,
      roles: [],
    },
  }
  if (msg.sender.role === constants.chat_roles.owner) {
    if (m.member)
      m.member.roles = [
        {
          name: 'Admin',
        },
      ]
  }
  return m
}

/**
 * Processes a payload containing data about a bot response message.
 *
 * @param {Payload} dat - The payload object containing the data for the message.
 * @returns {Promise<void>}
 */
export async function receiveBotRes(dat: Payload): Promise<void> {
  sphinxLogger.info('=> receiveBotRes', logging.Network) //, payload)

  if (!dat.chat || !dat.message || !dat.sender) {
    return sphinxLogger.error('=> receiveBotRes error, no chat||msg||sender')
  }
  const chat_uuid = dat.chat && dat.chat.uuid
  const sender_pub_key = dat.sender.pub_key
  const amount = dat.message.amount || 0
  const msg_uuid = dat.message.uuid || ''
  const reply_uuid = dat.message.replyUuid || ''
  const parent_id = dat.message.parentId || 0
  const content = dat.message.content
  const action = dat.action
  const bot_name = dat.bot_name
  const sender_alias = dat.sender.alias
  const sender_pic = dat.sender.photo_url
  const date_string = dat.message.date
  const network_type = dat.network_type || 0
  const owner = dat.owner
  const tenant: number = owner.id

  if (!chat_uuid)
    return sphinxLogger.error('=> receiveBotRes Error no chat_uuid')

  const chat: Chat = (await models.Chat.findOne({
    where: { uuid: chat_uuid, tenant },
  })) as Chat

  if (!chat) return sphinxLogger.error('=> receiveBotRes Error no chat')

  const tribeOwnerPubKey = chat && chat.ownerPubkey

  const isTribeOwner = owner.publicKey === tribeOwnerPubKey

  if (isTribeOwner) {
    // console.log("=> is tribeOwner, do finalAction!")
    // IF IS TRIBE ADMIN forward to the tribe
    // received the entire action?
    const bot_id = dat.bot_id
    const recipient_id = dat.recipient_id
    finalAction(<Action>{
      bot_id,
      action,
      bot_name,
      chat_uuid,
      content,
      amount,
      reply_uuid,
      parent_id,
      msg_uuid,
      recipient_id,
    })
  } else {
    const theChat: Chat = (await models.Chat.findOne({
      where: {
        uuid: chat_uuid,
        tenant,
      },
    })) as Chat
    if (!chat)
      return sphinxLogger.error('=> receiveBotRes as sub error no chat')
    let date = new Date()
    date.setMilliseconds(0)
    if (date_string) date = new Date(date_string)

    const sender: Contact = (await models.Contact.findOne({
      where: { publicKey: sender_pub_key, tenant },
    })) as Contact
    const msg: { [k: string]: any } = {
      chatId: chat.id,
      uuid: msg_uuid,
      replyUuid: reply_uuid,
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
      network_type,
      tenant,
    }
    if (parent_id) msg.parentId = parent_id
    const message: Message = (await models.Message.create(msg)) as Message
    socket.sendJson(
      {
        type: 'message',
        response: jsonUtils.messageToJson(message, theChat, owner),
      },
      tenant
    )
  }
}

/**
 * Adds a Personal Access Token (PAT) to the Git Bot for the owner of the request.
 *
 * @param {Req} req - The request object containing the owner and the encrypted PAT.
 * @param {Res} res - The response object used to send the result of the operation.
 * @returns {Promise<void>} - An empty promise.
 */
export const addPatToGitBot = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  if (!req.body.encrypted_pat) return failure(res, 'no pat')
  const transportTokenKey = await getTransportKey()
  const pat = rsa.decrypt(transportTokenKey, req.body.encrypted_pat)
  if (!pat) return failure(res, 'failed to decrypt pat')
  try {
    await updateGitBotPat(tenant, pat)
    success(res, { updated: true })
  } catch (e) {
    failure(res, 'no bots')
  }
}

export const getBagdeChatBot = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const chatId = req.params.chatId
  if (!chatId) return
  const tenant: number = req.owner.id
  try {
    const badgeChatBot = await models.ChatBot.findOne({
      where: { chatId, tenant, botPrefix: '/badge' },
    })
    return success(res, badgeChatBot)
  } catch (error) {
    sphinxLogger.error(['=> could bot get badge chat Bot', error], logging.Bots)
    failure(res, 'could bot get badge chat Bot')
  }
}
