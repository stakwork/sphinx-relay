import fetch from 'node-fetch'
import { parseLDAT } from '../utils/ldat'
import * as rsa from '../crypto/rsa'
import * as crypto from 'crypto'
import * as meme from '../utils/meme'
import * as FormData from 'form-data'
import { models } from '../models'
import * as RNCryptor from 'jscryptor-2'
import { sendMessage } from './send'
// import { Op } from 'sequelize'
import constants from '../constants'

const msgtypes = constants.message_types

export async function modifyPayloadAndSaveMediaKey(
  payload,
  chat,
  sender,
  owner
) {
  if (payload.type !== msgtypes.attachment) return payload
  try {
    const ret = await downloadAndUploadAndSaveReturningTermsAndKey(
      payload,
      chat,
      sender,
      owner
    )
    return fillmsg(payload, ret) // key is re-encrypted later
  } catch (e) {
    console.log('[modify] error', e)
    return payload
  }
}

// "purchase" type
export async function purchaseFromOriginalSender(
  payload,
  chat,
  purchaser,
  owner
) {
  const tenant = owner.id
  if (payload.type !== msgtypes.purchase) return

  const mt = payload.message && payload.message.mediaToken
  const amount = payload.message.amount
  const muid = mt && mt.split('.').length && mt.split('.')[1]
  if (!muid) return

  const mediaKey = await models.MediaKey.findOne({
    where: { originalMuid: muid, tenant },
  })

  const terms = parseLDAT(mt)
  let price = terms.meta && terms.meta.amt
  if (amount < price) return // not enough sats

  if (mediaKey) {
    // ALREADY BEEN PURHCASED! simply send
    // send back the new mediaToken and key
    const mediaTerms: { [k: string]: any } = {
      muid: mediaKey.muid,
      ttl: 31536000,
      host: '',
      meta: { ...(amount && { amt: amount }) },
    }
    // send full new key and token
    const msg = {
      mediaTerms,
      mediaKey: mediaKey.key,
      originalMuid: mediaKey.originalMuid,
      mediaType: mediaKey.mediaType,
    }
    sendMessage({
      chat: { ...chat.dataValues, contactIds: [purchaser.id] }, // the merchant id
      sender: owner,
      type: constants.message_types.purchase_accept,
      message: msg,
      success: () => {},
      failure: () => {},
    })
    // PAY THE OG POSTER HERE!!!
    sendMessage({
      chat: { ...chat.dataValues, contactIds: [mediaKey.sender] },
      sender: owner,
      type: constants.message_types.purchase,
      amount: amount,
      realSatsContactId: mediaKey.sender,
      message: {
        mediaToken: mt,
        skipPaymentProcessing: true,
      },
      success: () => {},
      failure: () => {},
    })
  } else {
    const ogmsg = await models.Message.findOne({
      where: { chatId: chat.id, mediaToken: mt, tenant },
    })
    if (!ogmsg) return
    // purchase it from creator (send "purchase")
    const msg = { mediaToken: mt, purchaser: purchaser.id }
    sendMessage({
      chat: { ...chat.dataValues, contactIds: [ogmsg.sender] },
      sender: {
        ...owner.dataValues,
        ...(purchaser && purchaser.alias && { alias: purchaser.alias }),
        role: constants.chat_roles.reader,
      },
      type: constants.message_types.purchase,
      realSatsContactId: ogmsg.sender,
      message: msg,
      amount: amount,
      success: () => {},
      failure: () => {},
      isForwarded: true,
    })
  }
}

export async function sendFinalMemeIfFirstPurchaser(
  payload,
  chat,
  sender,
  owner
) {
  const tenant = owner.id
  if (payload.type !== msgtypes.purchase_accept) return

  const mt = payload.message && payload.message.mediaToken
  const typ = payload.message && payload.message.mediaType
  const purchaserID = payload.message && payload.message.purchaser
  if (!mt) return
  const muid = mt && mt.split('.').length && mt.split('.')[1]
  if (!muid) return

  const existingMediaKey = await models.MediaKey.findOne({
    where: { muid, tenant },
  })
  if (existingMediaKey) return // no need, its already been sent

  // const host = mt.split('.')[0]

  const terms = parseLDAT(mt)
  const ogPurchaser = await models.Contact.findOne({
    where: {
      id: purchaserID,
      tenant,
    },
  })

  if (!ogPurchaser) return

  const amt = (terms.meta && terms.meta.amt) || 0

  // const ogPurchaseMessage = await models.Message.findOne({where:{
  //   mediaToken: {[Op.like]: `${host}.${muid}%`},
  //   type: msgtypes.purchase,
  // }})

  const termsAndKey = await downloadAndUploadAndSaveReturningTermsAndKey(
    payload,
    chat,
    sender,
    owner,
    amt
  )

  // send it to the purchaser
  sendMessage({
    sender: {
      ...owner.dataValues,
      ...(sender && sender.alias && { alias: sender.alias }),
      role: constants.chat_roles.reader,
    },
    chat: {
      ...chat.dataValues,
      contactIds: [ogPurchaser.id],
    },
    type: msgtypes.purchase_accept,
    message: {
      ...termsAndKey,
      mediaType: typ,
      originalMuid: muid,
    },
    success: () => {},
    receive: () => {},
    isForwarded: true,
  })
}

function fillmsg(full, props) {
  return {
    ...full,
    message: {
      ...full.message,
      ...props,
    },
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function downloadAndUploadAndSaveReturningTermsAndKey(
  payload,
  chat,
  sender,
  owner,
  injectedAmount?: number
) {
  const mt = payload.message && payload.message.mediaToken
  const key = payload.message && payload.message.mediaKey
  const typ = payload.message && payload.message.mediaType
  if (!mt || !key) return payload // save anyway??????????

  // console.log('[modify] ==> downloadAndUploadAndSaveReturningTermsAndKey', owner)
  const tenant = owner.id
  const ownerPubkey = owner.publicKey

  const ogmuid = mt && mt.split('.').length && mt.split('.')[1]

  const terms = parseLDAT(mt)
  if (!terms.host) return payload

  const token = await meme.lazyToken(ownerPubkey, terms.host)
  // console.log('[modify] meme token', token)
  // console.log('[modify] terms.host', terms.host)
  // console.log('[modify] mt', mt)
  try {
    let protocol = 'https'
    if (terms.host.includes('localhost')) protocol = 'http'
    const r = await fetch(`${protocol}://${terms.host}/file/${mt}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // console.log("[modify] dl RES", r)
    const buf = await r.buffer()

    const decMediaKey = rsa.decrypt(chat.groupPrivateKey, key)

    // console.log('[modify] about to decrypt', buf.length, decMediaKey)
    const imgBuf = RNCryptor.Decrypt(buf.toString('base64'), decMediaKey)

    const newKey = crypto.randomBytes(20).toString('hex')

    // console.log('[modify] about to encrypt', imgBuf.length, newKey)
    const encImgBase64 = RNCryptor.Encrypt(imgBuf, newKey)

    var encImgBuffer = Buffer.from(encImgBase64, 'base64')

    const form = new FormData()
    form.append('file', encImgBuffer, {
      contentType: typ || 'image/jpg',
      filename: 'Image.jpg',
      knownLength: encImgBuffer.length,
    })
    const formHeaders = form.getHeaders()
    const resp = await fetch(`${protocol}://${terms.host}/file`, {
      method: 'POST',
      headers: {
        ...formHeaders, // THIS IS REQUIRED!!!
        Authorization: `Bearer ${token}`,
      },
      body: form,
    })

    let json = await resp.json()
    if (!json.muid) throw new Error('no muid')

    // PUT NEW TERMS, to finish in personalizeMessage
    const amt = (terms.meta && terms.meta.amt) || injectedAmount
    const ttl = terms.meta && terms.meta.ttl
    const mediaTerms: { [k: string]: any } = {
      muid: json.muid,
      ttl: ttl || 31536000,
      host: '',
      meta: { ...(amt && { amt }) },
    }

    const encKey = rsa.encrypt(chat.groupKey, newKey.slice())
    var date = new Date()

    date.setMilliseconds(0)
    await sleep(1)
    await models.MediaKey.create({
      muid: json.muid,
      chatId: chat.id,
      key: encKey,
      messageId: (payload.message && payload.message.id) || 0,
      receiver: 0,
      sender: sender.id, // the og sender (merchant) who is sending the completed media token
      createdAt: date,
      originalMuid: ogmuid,
      mediaType: typ,
      tenant,
    })
    return { mediaTerms, mediaKey: encKey }
  } catch (e) {
    throw e
  }
}
