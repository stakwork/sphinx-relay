import {models} from '../models'
import * as socket from '../utils/socket'
import * as jsonUtils from '../utils/json'
import * as resUtils from '../utils/res'
import * as helpers from '../helpers'
import { sendNotification } from '../hub'
import { signBuffer, verifyMessage } from '../utils/lightning'
import * as rp from 'request-promise'
import { loadLightning } from '../utils/lightning'
import {parseLDAT, tokenFromTerms, urlBase64FromBytes, testLDAT} from '../utils/ldat'
import {CronJob} from 'cron'
import * as zbase32 from '../utils/zbase32'
import * as schemas from './schemas'
import {sendConfirmation} from './confirmations'

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/app.json')[env];
const constants = require(__dirname + '/../../config/constants.json');

/*

TODO line 233: parse that from token itself, dont use getMediaInfo at all

"attachment": sends a message to a chat with a signed receipt for a file, which can be accessed from sphinx-meme server
If the attachment has a price, then the media must be purchased to get the receipt

"purchase" sends sats.
if the amount matches the price, the media owner
will respond ("purchase_accept" or "purchase_deny" type)
with the signed token, which can only be used by the buyer

purchase_accept should update the original attachment message with the terms and receipt
(both Relay and client need to do this) or make new???

purchase_deny returns the sats
*/

const sendAttachmentMessage = async (req, res) => {
  // try {
  //   schemas.attachment.validateSync(req.body)
  // } catch(e) {
  //   return resUtils.failure(res, e.message)
  // }
  
  const {
    chat_id,
    contact_id,
    muid,
    text,
    remote_text,
    remote_text_map,
    media_key_map,
    media_type,
    file_name,
    ttl,
    price, // IF AMOUNT>0 THEN do NOT sign or send receipt
  } = req.body

  console.log('[send attachment]', req.body)

  const owner = await models.Contact.findOne({ where: { isOwner: true }})
  const chat = await helpers.findOrCreateChat({
    chat_id,
    owner_id: owner.id,
    recipient_id: contact_id
  })

  let TTL = ttl
  if(ttl) {
    TTL = parseInt(ttl)
  }
  if(!TTL) TTL = 31536000 // default year

  const amt = price||0
  // generate media token for self!
  const myMediaToken = await tokenFromTerms({
    muid, ttl:TTL, host:'',
    pubkey: owner.publicKey,
    meta:{...amt && {amt}, ttl}
  })

  const date = new Date();
  date.setMilliseconds(0)
  const myMediaKey = (media_key_map && media_key_map[owner.id]) || ''
  const mediaType = media_type || ''
  const remoteMessageContent = remote_text_map?JSON.stringify(remote_text_map) : remote_text
  
  const message = await models.Message.create({
    chatId: chat.id,
    sender: owner.id,
    type: constants.message_types.attachment,
    status: constants.statuses.pending,
    messageContent: text||file_name||'',
    remoteMessageContent,
    mediaToken: myMediaToken,
    mediaKey: myMediaKey,
    mediaType: mediaType,
    date,
    createdAt: date,
    updatedAt: date
  })

  saveMediaKeys(muid, media_key_map, chat.id, message.id)

  const mediaTerms: {[k:string]:any} = {
    muid, ttl:TTL,
    meta:{...amt && {amt}},
    skipSigning: amt ? true : false // only sign if its free
  }
  const msg: {[k:string]:any} = {
    mediaTerms, // this gets converted to mediaToken
    id: message.id,
    content: remote_text_map||remote_text||text||file_name||'',
    mediaKey: media_key_map,
    mediaType: mediaType,
  }
  helpers.sendMessage({
    chat: chat,
    sender: owner,
    type: constants.message_types.attachment,
    message: msg,
    success: async (data) => {
      console.log('attachment sent', { data })
      resUtils.success(res, jsonUtils.messageToJson(message, chat))
    },
    failure: error=> resUtils.failure(res, error.message),
  })
}

function saveMediaKeys(muid, mediaKeyMap, chatId, messageId){
  if (typeof mediaKeyMap!=='object'){
    console.log('wrong type for mediaKeyMap')
    return
  }
  var date = new Date();
  date.setMilliseconds(0)
  for (let [contactId, key] of Object.entries(mediaKeyMap)) {
    if(parseInt(contactId)!==1) {
      models.MediaKey.create({
        muid, chatId, key, messageId,
        receiver: parseInt(contactId),
        createdAt: date,
      })
    }
  }
}

const purchase = async (req, res) => {
  const {
    chat_id,
    contact_id,
    amount,
    media_token,
  } = req.body
  var date = new Date();
  date.setMilliseconds(0)

  try {
    schemas.purchase.validateSync(req.body)
  } catch(e) {
    return resUtils.failure(res, e.message)
  }

  console.log('purchase!')
  const owner = await models.Contact.findOne({ where: { isOwner: true }})
  const chat = await helpers.findOrCreateChat({
    chat_id,
    owner_id: owner.id,
    recipient_id: contact_id
  })

  const message = await models.Message.create({
    chatId: chat.id,
    sender: owner.id,
    type: constants.message_types.purchase,
    mediaToken: media_token,
    date: date,
    createdAt: date,
    updatedAt: date
  })

  const msg={
    amount, mediaToken:media_token, id:message.id,
  }
  helpers.sendMessage({
    chat: {...chat.dataValues, contactIds:[contact_id]},
    sender: owner,
    type: constants.message_types.purchase,
    message: msg,
    amount: amount,
    success: async (data) => {
      console.log('purchase sent!')
      resUtils.success(res, jsonUtils.messageToJson(message, chat))
    },
    failure: error=> resUtils.failure(res, error.message),
  })
}

/* RECEIVERS */

const receivePurchase = async (payload) => {
  console.log('=> received purchase', { payload })

  var date = new Date();
  date.setMilliseconds(0)

  const {owner, sender, chat, amount, mediaToken} = await helpers.parseReceiveParams(payload)
  if(!owner || !sender || !chat) {
    return console.log('=> group chat not found!')
  }

  await models.Message.create({
    chatId: chat.id,
    sender: sender.id,
    type: constants.message_types.purchase,
    mediaToken: mediaToken,
    date: date,
    createdAt: date,
    updatedAt: date
  })

  const muid = mediaToken && mediaToken.split('.').length && mediaToken.split('.')[1]
  if(!muid){
    return console.log('no muid')
  }

  const ogMessage = models.Message.findOne({
    where:{mediaToken}
  })
  if (!ogMessage){
    return console.log('no original message')
  }
  // find mediaKey for who sent
  const mediaKey = models.MediaKey.findOne({where:{
    muid, receiver: sender.id,
  }})
  console.log('mediaKey found!',mediaKey)

  const terms = parseLDAT(mediaToken)
  // get info
  let TTL = terms.meta && terms.meta.ttl
  let price = terms.meta && terms.meta.amt
  if(!TTL || !price){
    const media = await getMediaInfo(muid)
    console.log("GOT MEDIA", media)
    if(media) {
      TTL = media.ttl && parseInt(media.ttl)
      price = media.price
    }
    if(!TTL) TTL = 31536000
    if(!price) price = 0
  }

  if (amount < price) { // didnt pay enough
    return helpers.sendMessage({ // "purchase_deny"
      chat: {...chat.dataValues, contactIds:[sender.id]}, // only send back to sender
      sender: owner,
      amount: amount,
      type: constants.message_types.purchase_deny,
      message: {amount,content:'Payment Denied',mediaToken},
      success: async (data) => {
        console.log('purchase_deny sent')
      },
      failure: error=> console.log('=> couldnt send purcahse deny', error),
    })
  }

  const acceptTerms = {
    muid, ttl: TTL, 
    meta: {amt:amount},
  }
  console.log("SEND THIS!", {
    mediaTerms: acceptTerms, // converted to token in utils/msg.ts
    mediaKey: mediaKey.key,
    mediaType: ogMessage.mediaType,
  })
  helpers.sendMessage({
    chat: {...chat.dataValues, contactIds:[sender.id]}, // only to sender
    sender: owner,
    type: constants.message_types.purchase_accept,
    message: {
      mediaTerms: acceptTerms, // converted to token in utils/msg.ts
      mediaKey: mediaKey.key,
      mediaType: ogMessage.mediaType,
    },
    success: async (data) => {
      console.log('purchase_accept sent!')
    },
    failure: error=> console.log('=> couldnt send purchase accept', error),
  })
}

const receivePurchaseAccept = async (payload) => {
  console.log('=> receivePurchaseAccept')
  var date = new Date();
  date.setMilliseconds(0)

  const {owner, sender, chat, mediaToken, mediaKey, mediaType} = await helpers.parseReceiveParams(payload)
  if(!owner || !sender || !chat) {
    return console.log('=> no group chat!')
  }

  const termsArray = mediaToken.split('.')
  // const host = termsArray[0]
  const muid = termsArray[1]
  if(!muid){
    return console.log('wtf no muid')
  }
  // const attachmentMessage = await models.Message.findOne({where:{
  //   mediaToken: {$like: `${host}.${muid}%`}
  // }})
  // if(attachmentMessage){
  //   console.log('=> updated msg!')
  //   attachmentMessage.update({
  //     mediaToken, mediaKey
  //   })
  // }

  const msg = await models.Message.create({
    chatId: chat.id,
    sender: sender.id,
    type: constants.message_types.purchase_accept,
    status: constants.statuses.received,
    mediaToken,
    mediaKey,
    mediaType,
    date: date,
    createdAt: date,
    updatedAt: date
  })
  socket.sendJson({
    type: 'purchase_accept',
    response: jsonUtils.messageToJson(msg, chat, sender)
  })
}

const receivePurchaseDeny = async (payload) => {
  console.log('=> receivePurchaseDeny')
  var date = new Date();
  date.setMilliseconds(0)
  const {owner, sender, chat, amount, mediaToken} = await helpers.parseReceiveParams(payload)
  if(!owner || !sender || !chat) {
    return console.log('=> no group chat!')
  }
  const msg = await models.Message.create({
    chatId: chat.id,
    sender: sender.id,
    type: constants.message_types.purchase_deny,
    status: constants.statuses.received,
    messageContent:'Purchase has been denied and sats returned to you',
    amount: amount,
    amountMsat: parseFloat(amount) * 1000,
    mediaToken,
    date: date,
    createdAt: date,
    updatedAt: date
  })
  socket.sendJson({
    type: 'purchase_deny',
    response: jsonUtils.messageToJson(msg, chat, sender)
  })
}

const receiveAttachment = async (payload) => {
  console.log('received attachment', { payload })

  var date = new Date();
  date.setMilliseconds(0)

  const {owner, sender, chat, mediaToken, mediaKey, mediaType, content, msg_id} = await helpers.parseReceiveParams(payload)
  if(!owner || !sender || !chat) {
    return console.log('=> no group chat!')
  }

  const msg: {[k:string]:any} = {
    chatId: chat.id,
    type: constants.message_types.attachment,
    sender: sender.id,
    date: date,
    createdAt: date,
    updatedAt: date
  }
  if(content) msg.messageContent = content
  if(mediaToken) msg.mediaToken = mediaToken
  if(mediaKey) msg.mediaKey = mediaKey
  if(mediaType) msg.mediaType = mediaType

  const message = await models.Message.create(msg)

  console.log('saved attachment', message.dataValues)

  socket.sendJson({
    type: 'attachment',
    response: jsonUtils.messageToJson(message, chat, sender)
  })

  sendNotification(chat, sender.alias, 'message')

  const theChat = {...chat.dataValues, contactIds:[sender.id]}
  sendConfirmation({ chat:theChat, sender: owner, msg_id })
}

async function signer(req, res) {
  if(!req.params.challenge) return resUtils.failure(res, "no challenge")
  try {
    const sig = await signBuffer(
      Buffer.from(req.params.challenge, 'base64')
    )
    const sigBytes = zbase32.decode(sig)
    const sigBase64 = urlBase64FromBytes(sigBytes)
    resUtils.success(res, {
      sig: sigBase64
    })
  } catch(e) {
    resUtils.failure(res, e)
  }
}

async function verifier(msg, sig) {
  try {
    const res = await verifyMessage(msg, sig)
    return res
  } catch(e) {
    console.log(e)
  }
}

async function getMyPubKey(){
  return new Promise((resolve,reject)=>{
    const lightning = loadLightning()
    var request = {}
    lightning.getInfo(request, function(err, response) {
      if(err) reject(err)
      if(!response.identity_pubkey) reject('no pub key')
      else resolve(response.identity_pubkey)
    });
  })
}

async function cycleMediaToken() {
  try{
    if (process.env.TEST_LDAT) testLDAT()

    const mt = await getMediaToken(null)
    if(mt) console.log('=> [meme] authed!')

    new CronJob('1 * * * *', function() { // every hour
      getMediaToken(true)
    })
  } catch(e) {
    console.log(e.message)
  }
}

const mediaURL = 'http://' + config.media_host + '/'
let mediaToken;
async function getMediaToken(force) {
  if(!force && mediaToken) return mediaToken
  await helpers.sleep(3000)
  try {
    const res = await rp.get(mediaURL+'ask')
    const r = JSON.parse(res)
    if (!(r && r.challenge && r.id)) {
      throw new Error('no challenge')
    }
    const sig = await signBuffer(
      Buffer.from(r.challenge, 'base64')
    )

    if(!sig) throw new Error('no signature')
    const pubkey = await getMyPubKey()
    if(!pubkey){
      throw new Error('no pub key!')
    }

    const sigBytes = zbase32.decode(sig)
    const sigBase64 = urlBase64FromBytes(sigBytes)

    const bod = await rp.post(mediaURL+'verify', {
      form:{id: r.id, sig:sigBase64, pubkey}
    })
    const body = JSON.parse(bod)
    if(!(body && body.token)){
      throw new Error('no token')
    }
    mediaToken = body.token
    return body.token
  } catch(e) {
    throw e
  }
}

async function getMediaInfo(muid) {
  try {
    const token = await getMediaToken(null)
    const res = await rp.get(mediaURL+'mymedia/'+muid,{
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      json:true
    })
    return res
  } catch(e) {
    return null
  }
}

export {
  sendAttachmentMessage,
  receiveAttachment,
  receivePurchase,
  receivePurchaseAccept,
  receivePurchaseDeny,
  purchase,
  signer,
  verifier,
  getMediaToken,
  cycleMediaToken
}
