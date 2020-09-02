import {processBotMessage} from '../controllers/bots'
import {Msg} from './interfaces'
import { models } from '../models'

export async function isBotMsg(msg:Msg, sentByMe:boolean): Promise<boolean> {
  const txt = msg.message.content
  const chat = await models.Chat.findOne({where:{
    uuid: msg.chat.uuid
  }})
  if(!chat) return false

  
  if(txt.startsWith('/bot ')) {
    const ok = processBotMessage(msg, chat, null)
    return ok?true:false
  }

  const botInTribe = await models.ChatMember.findOne({where:{
    bot:true, chatId: chat.id
  }})
  if(!botInTribe) return false
  if(!(botInTribe.botMakerPubkey && botInTribe.botUuid)) return false

  if(txt.startsWith(`${botInTribe.botPrefix} `)){
    const ok = await processBotMessage(msg, chat, botInTribe)
    return ok?true:false
  }

  return false

  // check if bot msg
  // check my ChatMembers to see if its here

  // process it "bot_cmd"
}
