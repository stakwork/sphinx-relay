import * as path from 'path'
import {Msg} from '../network/interfaces'
import * as short from 'short-uuid'
import * as rsa from '../crypto/rsa'
import { models } from '../models'
import * as socket from '../utils/socket'
import * as jsonUtils from '../utils/json'

const constants = require(path.join(__dirname, '../../config/constants.json'))

async function genBotRes(chat,text){
  var date = new Date()
  date.setMilliseconds(0)
  const owner = await models.Contact.findOne({ where: { isOwner: true } })
  const encryptedForMeText = rsa.encrypt(owner.contactKey, text)
  const msg:{[k:string]:any}={
		chatId: chat.id,
		uuid: short.generate(),
		type: constants.message_types.bot_res,
		sender: owner.id,
		amount: 0,
		date: date,
		messageContent: encryptedForMeText,
		remoteMessageContent: '',
		status: constants.statuses.confirmed,
		createdAt: date,
    updatedAt: date,
    senderAlias: 'Bot Mother'
  }
  const message = await models.Message.create(msg)
  socket.sendJson({
		type: 'message',
		response: jsonUtils.messageToJson(message, chat, owner)
	})
}

// return whether this is legit to process
export async function processBotMessage(msg:Msg, chat, botInTribe): Promise<boolean> {
  const txt = msg.message.content
  if(txt.startsWith('/bot ')){
    const arr = txt.split(' ')
    if(arr.length<2) return false
    const cmd = arr[1]
    switch(cmd) {
      case 'install':
        if(arr.length<3) return false
        installBot(arr[2], botInTribe)
      default:
        genBotRes(chat,botHelpHTML)
    }
  } else {

  }
  return true
}

const botHelpHTML=`<p>
  <b>Bot commands:</b>
  <ul>
    <li><b>/bot install {BOTNAME}:</b>&nbsp;Install a new bot
    <li><b>/bot help:</b>&nbsp;Print out this help message
  </ul>
<p>        
`

/* intercept */

export function installBot(botname,botInTribe) {
  console.log("INSTALL BOT NOW")
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
