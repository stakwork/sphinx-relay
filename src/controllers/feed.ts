
import {models} from '../models'
import * as helpers from '../helpers'
import { failure, success } from '../utils/res'
import constants from '../constants'

export interface ChatMeta {
  itemID: number,
  timestamp: number,
  sats_per_minute: number,
}

type DestinationType = 'wallet' | 'node'
export interface Destination {
  address: string
  split: number
  type: DestinationType
}

export const streamFeed = async (req,res) => {
  const {
    destinations,
    amount,
    chat_id,
    text
  }:{
    destinations:Destination[],
    amount:number,
    chat_id:number,
    text:string
  } = req.body

  if(!(destinations && destinations.length)) {
    return failure(res, 'no destinations')
  }
  let meta;
  try {
    meta = JSON.parse(text)
  } catch(e) {}
  if(!meta) {
    return failure(res, 'no meta')
  }

  if(meta && meta.itemID) {
    const cm:ChatMeta = {
      itemID: meta.itemID,
      timestamp: meta.timestamp||0,
      sats_per_minute: amount||0,
    }
    const chat = await models.Chat.findOne({ where: { id: chat_id } })
    if(!chat) {
      return failure(res, 'no chat')
    }
    await chat.update({meta: JSON.stringify(cm)})
  }

  const owner = await models.Contact.findOne({ where: { isOwner: true }})

  if(amount && typeof amount==='number') {
    await asyncForEach(destinations, async (d:Destination)=>{
      if (d.type === 'node') {
        if (!d.address) return
        if (d.address.length !== 66) return
        if (d.address===owner.publicKey) return // dont send to self
        const amt = Math.max(Math.round((d.split / 100) * amount), 1)
        await anonymousKeysend(owner, d.address, amt, text, function(){}, function(){})
      }
    })
  }

  success(res, {})
}


export async function anonymousKeysend(owner, destination_key:string, amount:number, text:string, onSuccess:Function, onFailure:Function){
  const msg:{[k:string]:any} = {
    type:constants.message_types.keysend,
  }
  if(text) msg.message = {content:text}

  return helpers.performKeysendMessage({
    sender:owner,
    destination_key,
    amount,
    msg,
    success: () => {
      console.log('payment sent!')
      var date = new Date();
      date.setMilliseconds(0)
      models.Message.create({
        chatId: 0,
        type: constants.message_types.keysend,
        sender: 1,
        amount,
        amountMsat: amount*1000,
        paymentHash: '',
        date,
        messageContent: text||'',
        status: constants.statuses.confirmed,
        createdAt: date,
        updatedAt: date
      })
      onSuccess({destination_key, amount})
    },
    failure: (error) => {
      onFailure(error)
    }
  })
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}