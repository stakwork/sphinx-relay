import { models } from '../models'
import * as socket from '../utils/socket'
import * as jsonUtils from '../utils/json'
import * as resUtils from '../utils/res'
import * as helpers from '../helpers'
import { sendNotification } from '../hub'
import * as Lightning from '../grpc/lightning'
import * as rp from 'request-promise'
import { parseLDAT, tokenFromTerms, urlBase64FromBytes } from '../utils/ldat'
import * as meme from '../utils/meme'
import * as zbase32 from '../utils/zbase32'
import * as schemas from './schemas'
import { sendConfirmation } from './confirmations'
import * as network from '../network'
import * as short from 'short-uuid'
import constants from '../constants'
import { loadConfig } from '../utils/config'
import { failure } from '../utils/res'
import { logging } from '../utils/logger'

const config = loadConfig()

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

export const sendAttachmentMessage = async (req, res) => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
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
    amount,
    file_name,
    ttl,
    price, // IF AMOUNT>0 THEN do NOT sign or send receipt
    reply_uuid,
  } = req.body

  console.log('[send attachment]', req.body)

  const owner = req.owner
  const chat = await helpers.findOrCreateChat({
    chat_id,
    owner_id: owner.id,
    recipient_id: contact_id,
  })
  if (!chat) return failure(res, 'counldnt findOrCreateChat')

  let TTL = ttl
  if (ttl) {
    TTL = parseInt(ttl)
  }
  if (!TTL) TTL = 31536000 // default year

  const amt = price || 0
  // generate media token for self!
  const myMediaToken = await tokenFromTerms({
    muid,
    ttl: TTL,
    host: '',
    pubkey: owner.publicKey,
    meta: { ...(amt && { amt }), ttl },
    ownerPubkey: owner.publicKey,
  })

  const date = new Date()
  date.setMilliseconds(0)
  const myMediaKey = (media_key_map && media_key_map[owner.id]) || ''
  const mediaType = media_type || ''
  const remoteMessageContent = remote_text_map
    ? JSON.stringify(remote_text_map)
    : remote_text

  const uuid = short.generate()
  const mm: { [k: string]: any } = {
    chatId: chat.id,
    uuid: uuid,
    sender: owner.id,
    type: constants.message_types.attachment,
    status: constants.statuses.pending,
    amount: amount || 0,
    messageContent: text || file_name || '',
    remoteMessageContent,
    mediaToken: myMediaToken,
    mediaKey: myMediaKey,
    mediaType: mediaType,
    date,
    createdAt: date,
    updatedAt: date,
    tenant,
  }
  if (reply_uuid) mm.replyUuid = reply_uuid
  const message = await models.Message.create(mm)

  console.log('saved attachment msg from me', message.id)

  saveMediaKeys(muid, media_key_map, chat.id, message.id, mediaType, tenant)

  const mediaTerms: { [k: string]: any } = {
    muid,
    ttl: TTL,
    meta: { ...(amt && { amt }) },
    skipSigning: amt ? true : false, // only sign if its free
  }
  const msg: { [k: string]: any } = {
    mediaTerms, // this gets converted to mediaToken
    id: message.id,
    uuid: uuid,
    content: remote_text_map || remote_text || text || file_name || '',
    mediaKey: media_key_map,
    mediaType: mediaType,
  }
  if (reply_uuid) msg.replyUuid = reply_uuid
  network.sendMessage({
    chat: chat,
    sender: owner,
    type: constants.message_types.attachment,
    amount: amount || 0,
    message: msg,
    success: async (data) => {
      console.log('attachment sent', { data })
      resUtils.success(res, jsonUtils.messageToJson(message, chat))
    },
    failure: (error) => resUtils.failure(res, error.message),
  })
}

export function saveMediaKeys(
  muid,
  mediaKeyMap,
  chatId,
  messageId,
  mediaType,
  tenant
) {
  if (typeof mediaKeyMap !== 'object') {
    console.log('wrong type for mediaKeyMap')
    return
  }
  var date = new Date()
  date.setMilliseconds(0)
  for (let [contactId, key] of Object.entries(mediaKeyMap)) {
    if (parseInt(contactId) !== tenant) {
      const receiverID = parseInt(contactId) || 0 // 0 is for a tribe
      models.MediaKey.create({
        muid,
        chatId,
        key,
        messageId,
        receiver: receiverID,
        createdAt: date,
        mediaType,
        tenant,
      })
    }
  }
}

export const purchase = async (req, res) => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { chat_id, contact_id, amount, media_token } = req.body
  var date = new Date()
  date.setMilliseconds(0)

  try {
    schemas.purchase.validateSync(req.body)
  } catch (e) {
    return resUtils.failure(res, e.message)
  }

  const owner = req.owner
  const chat = await helpers.findOrCreateChat({
    chat_id,
    owner_id: owner.id,
    recipient_id: contact_id,
  })
  if (!chat) return failure(res, 'counldnt findOrCreateChat')

  const message = await models.Message.create({
    chatId: chat.id,
    uuid: short.generate(),
    sender: owner.id,
    type: constants.message_types.purchase,
    status: constants.statuses.confirmed,
    amount: amount || 0,
    mediaToken: media_token,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type: constants.network_types.lightning,
    tenant,
  })

  const msg = {
    mediaToken: media_token,
    id: message.id,
    uuid: message.uuid,
    purchaser: owner.id, // for tribe, knows who sent
  }
  network.sendMessage({
    chat: { ...chat.dataValues, contactIds: [contact_id] },
    sender: owner,
    type: constants.message_types.purchase,
    realSatsContactId: contact_id, // ALWAYS will be keysend, so doesnt matter if tribe owner or not
    message: msg,
    amount: amount,
    success: async (data) => {
      console.log('purchase sent!')
      resUtils.success(res, jsonUtils.messageToJson(message, chat))
    },
    failure: (error) => resUtils.failure(res, error.message),
  })
}

/* RECEIVERS */

export const receivePurchase = async (payload) => {
  if (logging.Network) console.log('=> received purchase', { payload })

  var date = new Date()
  date.setMilliseconds(0)

  const {
    owner,
    sender,
    chat,
    amount,
    mediaToken,
    msg_uuid,
    chat_type,
    skip_payment_processing,
    purchaser_id,
    network_type,
  } = await helpers.parseReceiveParams(payload)
  if (!owner || !sender || !chat) {
    return console.log('=> group chat not found!')
  }
  const tenant: number = owner.id

  const message = await models.Message.create({
    chatId: chat.id,
    uuid: msg_uuid,
    sender: sender.id,
    type: constants.message_types.purchase,
    status: constants.statuses.received,
    amount: amount || 0,
    mediaToken: mediaToken,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  })
  socket.sendJson(
    {
      type: 'purchase',
      response: jsonUtils.messageToJson(message, chat, sender),
    },
    tenant
  )

  const isTribe = chat_type === constants.chat_types.tribe

  // if sats forwarded from tribe owner, for the >1 time
  // dont need to send back token, because admin already has it
  if (isTribe && skip_payment_processing) {
    return console.log('=> skip payment processing')
  }

  const muid =
    mediaToken && mediaToken.split('.').length && mediaToken.split('.')[1]
  if (!muid) {
    return console.log('no muid')
  }

  const ogMessage = await models.Message.findOne({
    where: { mediaToken, tenant },
  })
  if (!ogMessage) {
    return console.log('no original message')
  }

  // find mediaKey for who sent
  const mediaKey = await models.MediaKey.findOne({
    where: {
      muid,
      receiver: isTribe ? 0 : sender.id,
      tenant,
    },
  })
  // console.log('mediaKey found!',mediaKey.dataValues)
  if (!mediaKey) return // this is from another person (admin is forwarding)

  const terms = parseLDAT(mediaToken)
  // get info
  let TTL = terms.meta && terms.meta.ttl
  let price = terms.meta && terms.meta.amt
  if (!TTL || !price) {
    const media = await getMediaInfo(muid, owner.publicKey)
    console.log('GOT MEDIA', media)
    if (media) {
      TTL = media.ttl && parseInt(media.ttl)
      price = media.price
    }
    if (!TTL) TTL = 31536000
    if (!price) price = 0
  }

  if (amount < price) {
    // didnt pay enough
    return network.sendMessage({
      // "purchase_deny"
      chat: { ...chat.dataValues, contactIds: [sender.id] }, // only send back to sender
      sender: owner,
      amount: amount,
      type: constants.message_types.purchase_deny,
      message: { amount, content: 'Payment Denied', mediaToken },
      success: async (data) => {
        console.log('purchase_deny sent')
        const denyMsg = await models.Message.create({
          chatId: chat.id,
          sender: owner.id,
          type: constants.message_types.purchase_deny,
          mediaToken: mediaToken,
          date: date,
          createdAt: date,
          updatedAt: date,
          tenant,
        })
        socket.sendJson(
          {
            type: 'purchase_deny',
            response: jsonUtils.messageToJson(denyMsg, chat, sender),
          },
          tenant
        )
      },
      failure: (error) => console.log('=> couldnt send purcahse deny', error),
    })
  }

  const theMediaToken = await tokenFromTerms({
    muid,
    ttl: TTL,
    host: '',
    meta: { amt: amount },
    pubkey: sender.publicKey,
    ownerPubkey: owner.publicKey,
  })
  const msgToSend: { [k: string]: any } = {
    mediaToken: theMediaToken,
    mediaKey: mediaKey.key,
    mediaType: ogMessage.mediaType,
  }
  if (purchaser_id) msgToSend.purchaser = purchaser_id
  network.sendMessage({
    chat: { ...chat.dataValues, contactIds: [sender.id] }, // only to sender
    sender: owner,
    type: constants.message_types.purchase_accept,
    message: msgToSend,
    success: async (data) => {
      console.log('purchase_accept sent!')
      const acceptMsg = await models.Message.create({
        chatId: chat.id,
        sender: owner.id,
        type: constants.message_types.purchase_accept,
        mediaToken: theMediaToken,
        date: date,
        createdAt: date,
        updatedAt: date,
        tenant,
      })
      socket.sendJson(
        {
          type: 'purchase_accept',
          response: jsonUtils.messageToJson(acceptMsg, chat, sender),
        },
        tenant
      )
    },
    failure: (error) => console.log('=> couldnt send purchase accept', error),
  })
}

export const receivePurchaseAccept = async (payload) => {
  if (logging.Network) console.log('=> receivePurchaseAccept')
  var date = new Date()
  date.setMilliseconds(0)

  const {
    owner,
    sender,
    chat,
    mediaToken,
    mediaKey,
    mediaType,
    originalMuid,
    network_type,
  } = await helpers.parseReceiveParams(payload)
  if (!owner || !sender || !chat) {
    return console.log('=> no group chat!')
  }
  const tenant: number = owner.id

  const termsArray = mediaToken.split('.')
  // const host = termsArray[0]
  const muid = termsArray[1]
  if (!muid) {
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
    originalMuid: originalMuid || '',
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  })
  socket.sendJson(
    {
      type: 'purchase_accept',
      response: jsonUtils.messageToJson(msg, chat, sender),
    },
    tenant
  )
}

export const receivePurchaseDeny = async (payload) => {
  if (logging.Network) console.log('=> receivePurchaseDeny')
  var date = new Date()
  date.setMilliseconds(0)
  const { owner, sender, chat, amount, mediaToken, network_type } =
    await helpers.parseReceiveParams(payload)
  if (!owner || !sender || !chat) {
    return console.log('=> no group chat!')
  }
  const tenant: number = owner.id
  const msg = await models.Message.create({
    chatId: chat.id,
    sender: sender.id,
    type: constants.message_types.purchase_deny,
    status: constants.statuses.received,
    messageContent: 'Purchase has been denied and sats returned to you',
    amount: amount,
    amountMsat: parseFloat(amount) * 1000,
    mediaToken,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  })
  socket.sendJson(
    {
      type: 'purchase_deny',
      response: jsonUtils.messageToJson(msg, chat, sender),
    },
    tenant
  )
}

export const receiveAttachment = async (payload) => {
  // console.log('received attachment', { payload })

  var date = new Date()
  date.setMilliseconds(0)

  const {
    owner,
    sender,
    chat,
    mediaToken,
    mediaKey,
    mediaType,
    content,
    msg_id,
    chat_type,
    sender_alias,
    msg_uuid,
    reply_uuid,
    network_type,
    sender_photo_url,
  } = await helpers.parseReceiveParams(payload)
  if (!owner || !sender || !chat) {
    return console.log('=> no group chat!')
  }
  const tenant: number = owner.id

  const msg: { [k: string]: any } = {
    chatId: chat.id,
    uuid: msg_uuid,
    type: constants.message_types.attachment,
    status: constants.statuses.received,
    sender: sender.id,
    date: date,
    createdAt: date,
    updatedAt: date,
    network_type,
    tenant,
  }
  if (content) msg.messageContent = content
  if (mediaToken) msg.mediaToken = mediaToken
  if (mediaKey) msg.mediaKey = mediaKey
  if (mediaType) msg.mediaType = mediaType
  if (reply_uuid) msg.replyUuid = reply_uuid
  const isTribe = chat_type === constants.chat_types.tribe
  if (isTribe) {
    msg.senderAlias = sender_alias
    msg.senderPic = sender_photo_url
  }

  const message = await models.Message.create(msg)

  // console.log('saved attachment', message.dataValues)

  socket.sendJson(
    {
      type: 'attachment',
      response: jsonUtils.messageToJson(message, chat, sender),
    },
    tenant
  )

  sendNotification(chat, msg.senderAlias || sender.alias, 'message', owner)

  sendConfirmation({ chat, sender: owner, msg_id, receiver: sender })
}

export async function signer(req, res) {
  if (!req.owner) return failure(res, 'no owner')
  // const tenant:number = req.owner.id
  if (!req.params.challenge) return resUtils.failure(res, 'no challenge')
  try {
    const sig = await Lightning.signBuffer(
      Buffer.from(req.params.challenge, 'base64'),
      req.owner.publicKey
    )
    const sigBytes = zbase32.decode(sig)
    const sigBase64 = urlBase64FromBytes(sigBytes)
    resUtils.success(res, {
      sig: sigBase64,
    })
  } catch (e) {
    resUtils.failure(res, e)
  }
}

export async function verifier(msg, sig) {
  try {
    const res = await Lightning.verifyMessage(msg, sig)
    return res
  } catch (e) {
    console.log(e)
  }
}

export async function getMediaInfo(muid, pubkey: string) {
  try {
    const token = await meme.lazyToken(pubkey, config.media_host)
    const host = config.media_host
    let protocol = 'https'
    if (host.includes('localhost')) protocol = 'http'
    if (host.includes('meme.sphinx:5555')) protocol = 'http'
    const mediaURL = `${protocol}://${host}/`
    const res = await rp.get(mediaURL + 'mymedia/' + muid, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      json: true,
    })
    return res
  } catch (e) {
    return null
  }
}
