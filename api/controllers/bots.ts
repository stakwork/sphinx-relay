import * as path from 'path'

const constants = require(path.join(__dirname, '../../config/constants.json'))

/* intercept */

export const installBot = async (req,res) => {
  // need bot uuid and maker pubkey
  // send bot_install to bot maker
  // mqtt sub to the bot uuid (dont need this actually)

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

// type BotResType = 'install' | 'message' | 'broadcast' | 'keysend'

export async function receiveBotRes(payload) {
  console.log(constants.message_types.bot_res)
}
