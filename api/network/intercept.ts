import {Msg} from './interfaces'
import { models } from '../models'
import {builtinBotEmit} from '../bots'

/*
default show or not
restrictions (be able to toggle, or dont show chat)
*/

// return bool whether to skip forwarding to tribe
export async function isBotMsg(msg:Msg, sentByMe:boolean): Promise<boolean> {
  const txt = msg.message.content
  const msgType = msg.type
  const chat = await models.Chat.findOne({where:{
    uuid: msg.chat.uuid
  }})
  if(!chat) return false

  let didEmit = false

  if(txt.startsWith('/bot ')) {
    builtinBotEmit(msg)
    didEmit = true
  }

  console.log("DID EMIT",didEmit)
  if(didEmit) return didEmit

  const botsInTribe = await models.ChatBot.findAll({where:{
    chatId: chat.id
  }})

  if(!(botsInTribe && botsInTribe.length)) return false

  await asyncForEach(botsInTribe, async botInTribe=>{
    console.log('botInTribe.botPrefix',botInTribe.botPrefix)
    if(botInTribe.msgTypes){
      try {
        const msgTypes = JSON.parse(botInTribe.msgTypes)
        if(msgTypes.includes(msgType)){
          builtinBotEmit(msg)
          didEmit = true
        }
      } catch(e){}
    } else if(txt.startsWith(`${botInTribe.botPrefix} `)){
      builtinBotEmit(msg)
      didEmit = true
    }
  })

  return didEmit
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  await callback(array[index], index, array);
	}
}