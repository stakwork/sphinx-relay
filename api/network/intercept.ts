import {processBotMessage} from '../controllers/bots'
import {Msg} from './interfaces'
import { models } from '../models'

// const defaultPrefixes = [
//   '/bot', '/welcome'
// ]

// return bool whether to skip forwarding to tribe
export async function isBotMsg(msg:Msg, sentByMe:boolean): Promise<boolean> {
  console.log("==> is bot msg???")
  const txt = msg.message.content
  const chat = await models.Chat.findOne({where:{
    uuid: msg.chat.uuid
  }})
  if(!chat) return false

  console.log("==> is bot msg txt",txt)
  if(txt.startsWith('/bot ')) {
    const ok = processBotMessage(msg, chat, null)
    return ok?true:false
  }

  const botsInTribe = await models.ChatMember.findAll({where:{
    bot:true, chatId: chat.id
  }})
  if(!(botsInTribe && botsInTribe.length)) return false

  let ok = false
  await asyncForEach(botsInTribe, async botInTribe=>{
    if(txt.startsWith(`${botInTribe.botPrefix} `)){
      ok = await processBotMessage(msg, chat, botInTribe)
    }
  })

  return ok
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  await callback(array[index], index, array);
	}
}