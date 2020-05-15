import * as path from 'path'

const constants = require(path.join(__dirname,'../../config/constants.json'))
const msgtypes = constants.message_types

export function modifyPayload(payload) {
  if(payload.type===msgtypes.attachment) {
    console.log("MODIFY, ", payload)
    // download image from mediaToken
    // decrypt key
    // decrypt image
    // new key, re-encrypt, re-upload
    // new payload

    // how to link w og msg? ogMediaToken?
  }
  return payload
}
