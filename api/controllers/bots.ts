import * as path from 'path'
import * as tribes from '../utils/tribes'
import * as crypto from 'crypto'
import { models } from '../models'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import * as network from '../network'

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
  const { name, webhook } = req.body

  const uuid = await tribes.genSignedTimestamp()
  const newBot = {
    name, uuid, webhook,
    id: crypto.randomBytes(12).toString('hex').toUpperCase(),
    secret: crypto.randomBytes(16).toString('hex').toUpperCase(),
    pricePerUse: 0
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

export function installBot(botname, botInTribe) {
  console.log("INSTALL BOT NOW")
  // search registry for bot (by name)

  // need bot uuid and maker pubkey
  // send bot_install to bot maker

  // generate ChatMember with bot=true
  // bot_maker_pubkey, bot_uuid, bot_prefix
}

export async function sendBotInstall(_, b): Promise<boolean> {
  return await botKeysend(
    constants.message_types.bot_install,
    b.botUuid, b.botMakerPubkey, b.pricePerUse,
  )
}

export async function sendBotCmd(msg, b): Promise<boolean> {
  return await botKeysend(
    constants.message_types.bot_cmd,
    b.botUuid, b.botMakerPubkey, b.pricePerUse,
    msg.message.content
  )
}

export async function receiveBotInstall(payload) {
  console.log('=> receiveBotInstall')

  // const dat = payload.content || payload
  // const sender_pub_key = dat.sender.pub_key
  // const bot_uuid = dat.bot_uuid

  // verify tribe ownership (verify signed timestamp)

  // CHECK PUBKEY - is it me? install it! (create botmember)
  // if the pubkey=the botOwnerPubkey, (create chatbot)
}

export async function botKeysend(msg_type, bot_uuid, botmaker_pubkey, price_per_use, content?:string): Promise<boolean> {
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

// type BotCmdType = 'install' | 'message' | 'broadcast' | 'keysend'

export async function receiveBotCmd(payload) {
  console.log("=> receiveBotCmd")
  console.log(constants.message_types.bot_cmd)
  // forward to the entire Action back

  // const dat = payload.content || payload
  // const sender_pub_key = dat.sender.pub_key
  // const bot_uuid = dat.bot_uuid
  // const content = dat.message.content - check prefix
  // const amount = dat.message.amount
}

export async function receiveBotRes(payload) {
  console.log("=> receiveBotRes")
  console.log(constants.message_types.bot_res)
  // forward to the tribe
  // received the entire action?

}
