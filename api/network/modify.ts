import * as path from 'path'
import * as fetch from 'node-fetch'
import {parseLDAT} from '../utils/ldat'
import * as rsa from '../crypto/rsa'
import * as crypto from 'crypto'
import * as meme from '../utils/meme'
import * as FormData from 'form-data'   
import { models } from '../models'
import * as RNCryptor from 'jscryptor'
import {sendMessage} from './send'

const constants = require(path.join(__dirname,'../../config/constants.json'))
const msgtypes = constants.message_types

export async function modifyPayloadAndSaveMediaKey(payload, chat, sender) {
  if(payload.type!==msgtypes.attachment) return payload
  try{
    const ret = await downloadAndUploadAndSaveReturningTermsAndKey(payload,chat,sender)
    return fillmsg(payload, ret) // key is re-encrypted later
  } catch(e) {
    console.log("[modify] error", e)
    return payload
  }
}

// "purchase" type
export async function purchaseFromOriginalSender(payload, chat, purchaser){
  if(payload.type!==msgtypes.purchase) return

  const mt = payload.message && payload.message.mediaToken
  const amount = payload.message.amount
  const muid = mt && mt.split('.').length && mt.split('.')[1]
  if(!muid) return

  const mediaKey = await models.MediaKey.findOne({where:{originalMuid:muid}})

  const terms = parseLDAT(mt)
  let price = terms.meta && terms.meta.amt
  if(amount<price) return // not enough sats

  const owner = await models.Contact.findOne({where: {isOwner:true}})

  if(mediaKey) { // ALREADY BEEN PURHCASED! simply send
    console.log("MEDIA KEY EXISTS ALREADY",mediaKey) 
    // send back the new mediaToken and key
    const mediaTerms: {[k:string]:any} = {
      muid, ttl:31536000, host:'',
      meta:{...amount && {amt:amount}},
    }
    // send full new key and token
    const msg = {mediaTerms, mediaKey:mediaKey.key}
    console.log("SEND PURCHASE ACCEPT FROM STORED KEY")
    sendMessage({
      chat: {...chat.dataValues, contactIds:[purchaser.id]},
      sender: owner,
      type: constants.message_types.purchase_accept,
      message: msg,
      success: ()=>{},
      failure: ()=>{}
    })
  } else {
    console.log("NO MEDIA KEY EXISTS YET") 
    const ogmsg = await models.Message.findOne({where:{chatId:chat.id,mediaToken:mt}})
    // purchase it from creator (send "purchase")
    const msg={amount, mediaToken:mt}
    console.log("GO AHEARD AND BUY!!! from:",ogmsg.sender,{
      chat: {...chat.dataValues, contactIds:[ogmsg.sender]},
      sender: {
        ...owner.dataValues,
        ...purchaser&&purchaser.alias && {alias:purchaser.alias}
      },
      type: constants.message_types.purchase,
      message: msg,
      amount: amount,
      success: ()=>{},
      failure: ()=>{}
    })
    sendMessage({
      chat: {...chat.dataValues, contactIds:[ogmsg.sender]},
      sender: {
        ...owner.dataValues,
        ...purchaser&&purchaser.alias && {alias:purchaser.alias}
      },
      type: constants.message_types.purchase,
      message: msg,
      amount: amount,
      success: ()=>{},
      failure: ()=>{}
    })
  }
}

export async function sendFinalMemeIfFirstPurchaser(payload, chat, sender){
  if(payload.type!==msgtypes.purchase_accept) return

  console.log("PURCHASE ACCEPT!!!!!")

  const mt = payload.message && payload.message.mediaToken
  const typ = payload.message && payload.message.mediaType
  if(!mt) return
  const muid = mt && mt.split('.').length && mt.split('.')[1]
  if(!muid) return

  const existingMediaKey = await models.MediaKey.findOne({where:{muid}})
  if(existingMediaKey) return // no need, its already been sent

  console.log("DOWNLOAD AND REIP:OAD",mt)
  const termsAndKey = await downloadAndUploadAndSaveReturningTermsAndKey(payload,chat,sender)

  const msg = await models.Message.findOne({where:{mediaToken:mt,type:msgtypes.attachment}})
  console.log("OG MSG",msg.dataValues) // not found
  const ogSender = await models.Contact.findOne({where:{id:msg.sender}})
  console.log("OG SENDER",ogSender.dataValues)
  // find "purchase" Message with the OG muid
  // send it to the purchaser
  const owner = await models.Contact.findOne({where: {isOwner:true}})
  console.log("SEND firST PURHCASE ACCEPT MSG!")
  sendMessage({
		sender: {
			...owner.dataValues,
			...ogSender&&ogSender.alias && {alias:ogSender.alias}
		},
    chat:{
      ...chat.dataValues,
      contactIds:[sender.id],
    },
    type:msgtypes.purchase_accept, 
    message:{
      ...termsAndKey,
      mediaType: typ,
    },
		success: ()=>{},
		receive: ()=>{}
	})
}

function fillmsg(full, props){
	return {
		...full, message: {
			...full.message,
			...props,
		}
	}
}

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export async function downloadAndUploadAndSaveReturningTermsAndKey(payload, chat, sender){
  const mt = payload.message && payload.message.mediaToken
  const key = payload.message && payload.message.mediaKey
  const typ = payload.message && payload.message.mediaType
  if(!mt || !key) return payload // save anyway??????????

  const ogmuid = mt && mt.split('.').length && mt.split('.')[1]

  const terms = parseLDAT(mt)
  if(!terms.host) return payload

  try {
    const r = await fetch(`https://${terms.host}/file/${mt}`, {
      headers: {'Authorization': `Bearer ${meme.mediaToken}`}
    })
    const buf = await r.buffer()

    const decMediaKey = rsa.decrypt(chat.groupPrivateKey, key)
  
    const imgBuf = RNCryptor.Decrypt(buf.toString('base64'), decMediaKey)

    const newKey = crypto.randomBytes(20).toString('hex')

    const encImgBase64 = RNCryptor.Encrypt(imgBuf, newKey)

    var encImgBuffer = Buffer.from(encImgBase64,'base64');

    const form = new FormData()
    form.append('file', encImgBuffer, {
      contentType: typ||'image/jpg',
      filename: 'Image.jpg',
      knownLength:encImgBuffer.length,
    })
    const formHeaders = form.getHeaders()
    const resp = await fetch(`https://${terms.host}/file`, {
      method: 'POST',
      headers: {
        ...formHeaders, // THIS IS REQUIRED!!!
        'Authorization': `Bearer ${meme.mediaToken}`,
      },
      body:form
    })

    let json = await resp.json()
    if(!json.muid) throw new Error('no muid')

    // PUT NEW TERMS, to finish in personalizeMessage
    const amt = terms.meta&&terms.meta.amt
    const ttl = terms.meta&&terms.meta.ttl
    const mediaTerms: {[k:string]:any} = {
      muid:json.muid, ttl:ttl||31536000, host:'',
      meta:{...amt && {amt}},
      skipSigning: amt ? true : false // only sign if its free
    }

    const encKey = rsa.encrypt(chat.groupKey, newKey.slice())
    var date = new Date()

    date.setMilliseconds(0)
    console.log('[modify] save media key!',{
      muid:json.muid,
      chatId:chat.id,
      key: encKey,
      messageId: (payload.message&&payload.message.id)||0,
      receiver: 0,
      sender: sender.id, // the og sender
      createdAt: date,
    })
    await sleep(1)
    await models.MediaKey.create({
      muid:json.muid,
      chatId:chat.id,
      key:encKey,
      messageId: (payload.message&&payload.message.id)||0,
      receiver: 0,
      sender: sender.id, // the og sender
      createdAt: date,
      originalMuid: ogmuid,
    })
    return {mediaTerms,mediaKey:encKey}
  } catch(e) {
    throw e
  }
}