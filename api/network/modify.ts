import * as path from 'path'
import RNCryptor from '../utils/rncryptor'
import * as fetch from 'node-fetch'
import {parseLDAT} from '../utils/ldat'
import * as rsa from '../crypto/rsa'
import * as crypto from 'crypto'
import * as meme from '../utils/meme'
import * as FormData from 'form-data'   
import { models } from '../models'

const constants = require(path.join(__dirname,'../../config/constants.json'))
const msgtypes = constants.message_types

export async function modifyPayloadAndSaveMediaKey(payload, chat, sender) {
  if(payload.type===msgtypes.attachment) {

    const mt = payload.message && payload.message.mediaToken
    const key = payload.message && payload.message.mediaKey
    const typ = payload.message && payload.message.mediaType
    if(!mt || !key) return payload

    const terms = parseLDAT(mt)
    if(!terms.host) return payload

    try {
      const r = await fetch(`https://${terms.host}/file/${mt}`, {
        headers: {'Authorization': `Bearer ${meme.mediaToken}`}
      })
      const buf = await r.buffer()

      const decMediaKey = rsa.decrypt(chat.groupPrivateKey, key)
   
      const imgBase64 = RNCryptor.Decrypt(decMediaKey, buf.toString('base64'))

      const newKey = crypto.randomBytes(20).toString('hex')

      const encImg = RNCryptor.Encrypt(newKey, imgBase64)

      var encImgBuffer = Buffer.from(encImg,'base64');

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
      if(!json.muid) return payload

      // PUT NEW TERMS, to finish in personalizeMessage
      const amt = terms.meta&&terms.meta.amt
      const ttl = terms.meta&&terms.meta.ttl
      const mediaTerms: {[k:string]:any} = {
        muid:json.muid, ttl:ttl||31536000, host:'',
        meta:{...amt && {amt}},
        skipSigning: amt ? true : false // only sign if its free
      }

      const encKey = rsa.encrypt(chat.groupKey, newKey)

      var date = new Date();
      date.setMilliseconds(0)
      console.log('[modify] save media key!',json.muid)
      models.MediaKey.create({
        muid:json.muid,
        chatId:chat.id,
        key:encKey,
        messageId: (payload.message&&payload.message.id)||0,
        receiver: 0,
        sender: sender.id, // the og sender
        createdAt: date,
      })

      return fillmsg(payload, {mediaTerms,mediaKey:encKey}) // key is re-encrypted later
    } catch(e) {
      console.log("[modify] error", e)
      return payload
    }
    // how to link w og msg? ogMediaToken?
  } else {
    return payload
  }
}

function fillmsg(full, props){
	return {
		...full, message: {
			...full.message,
			...props,
		}
	}
}