import * as path from 'path'
import RNCryptor from '../utils/rncryptor'
import * as fetch from 'node-fetch'
import {parseLDAT} from '../utils/ldat'
import * as rsa from '../crypto/rsa'
import * as crypto from 'crypto'
import * as Blob from 'fetch-blob'

const constants = require(path.join(__dirname,'../../config/constants.json'))
const msgtypes = constants.message_types

export async function modifyPayload(payload, chat) {
  if(payload.type===msgtypes.attachment) {
    console.log("MODIFY, ", payload)

    const mt = payload.message && payload.message.mediaToken
    const key = payload.message && payload.message.mediaKey
    const typ = payload.message && payload.message.mediaType
    if(!mt || !key) return payload

    const terms = parseLDAT(mt)
    if(!terms.host) return payload

    try {
      const r = await fetch(`https://${terms.host}/file/${mt}`)
      const buf = await r.buffer()

      const decMediaKey = rsa.decrypt(chat.groupPrivateKey, key)
   
      const imgUTF8 = RNCryptor.Decrypt(decMediaKey, buf.toString())

      const newKey = crypto.randomBytes(20).toString('hex')

      const encImg = RNCryptor.Encrypt(newKey, imgUTF8)

      const resp = await fetch(`https://${terms.host}/file`, {
        method: 'POST',
        body: new Blob([encImg], { type: typ||'image/jpg', name:'file', filename:'Image.jpg' })
      })

      let json = resp.json()
      if(!json.muid) return payload

      // PUT NEW TERMS, to finish in personalizeMessage
      const amt = terms.meta&&terms.meta.amt
      const ttl = terms.meta&&terms.meta.ttl
      const mediaTerms: {[k:string]:any} = {
        muid:json.muid, ttl:ttl||31536000,
        meta:{...amt && {amt}},
        skipSigning: amt ? true : false // only sign if its free
      }

      const encKey = rsa.encrypt(chat.groupKey, newKey)
      return fillmsg(payload, {mediaTerms,mediaKey:encKey}) // key is re-encrypted later
    } catch(e) {
      return payload
    }
    // how to link w og msg? ogMediaToken?
  }
  return payload
}

function fillmsg(full, props){
	return {
		...full, message: {
			...full.message,
			...props,
		}
	}
}