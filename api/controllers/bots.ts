import * as path from 'path'
import {Msg} from '../network/interfaces'
import {Action,finalActionProcess} from './actions'

const constants = require(path.join(__dirname, '../../config/constants.json'))

async function broadcastAction(chat,text){
  const a:Action = {
    action:'broadcast',
    text, chatID: chat.id,
    botName:'MotherBot'
  }
  finalActionProcess(a)
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
        return true
      default:
        broadcastAction(chat,botHelpHTML)
    }
  } else {

  }
  return true
}

const botHelpHTML=`<div>
  <b>Bot commands:</b>
  <ul>
    <li><b>/bot install {BOTNAME}:</b>&nbsp;Install a new bot
    <li><b>/bot help:</b>&nbsp;Print out this help message
  </ul>
<div>        
`

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
