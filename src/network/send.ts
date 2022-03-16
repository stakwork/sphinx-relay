import { models } from '../models'
import * as LND from '../grpc/lightning'
import { personalizeMessage, decryptMessage } from '../utils/msg'
import * as intercept from './intercept'
import constants from '../constants'
import { logging, sphinxLogger } from '../utils/logger'
import { Msg } from './interfaces'

type NetworkType = undefined | 'mqtt-over-http' | 'lightning'

export async function sendMessage(params) {
  const {
    type,
    chat,
    message,
    sender,
    amount,
    success,
    failure,
    skipPubKey,
    isForwarded,
    forwardedFromContactId,
    realSatsContactId,
  } = params
  if (!chat || !sender) return
  const tenant: number = sender.id
  if (!tenant) return

  const isTribe = chat.type === constants.chat_types.tribe
    const isTribeOwner = isTribe && sender.publicKey === chat.ownerPubkey
  // console.log('-> sender.publicKey', sender.publicKey)
  // console.log('-> chat.ownerPubkey', chat.ownerPubkey)

  let theSender = sender.dataValues || sender
  if (isTribeOwner && !isForwarded) {
    theSender = {
      ...(sender.dataValues || sender),
      role: constants.chat_roles.owner,
    }
  }
  let msg = newmsg(type, chat, theSender, message, isForwarded)

  // console.log("=> MSG TO SEND",msg)

  // console.log(type,message)
  if (!(sender && sender.publicKey)) {
    // console.log("NO SENDER?????");
    return
  }

  let contactIds =
    (typeof chat.contactIds === 'string'
      ? JSON.parse(chat.contactIds)
      : chat.contactIds) || []
  let justMe = false
  if (contactIds.length === 1) {
    if (contactIds[0] === tenant) {
      // JUST ME!
      justMe = true
    }
  }

  let networkType: NetworkType = undefined
  const chatUUID = chat.uuid
  if (isTribe) {
    if (type === constants.message_types.confirmation) {
      // if u are owner, go ahead!
      if (!isTribeOwner) return // dont send confs for tribe if not owner
    }
    if (isTribeOwner) {
      networkType = 'mqtt-over-http' // broadcast to all
      // decrypt message.content and message.mediaKey w groupKey
      msg = await decryptMessage(msg, chat)
      // console.log("SEND.TS isBotMsg")
      sphinxLogger.info(
        `[Network] => isTribeAdmin msg sending... ${msg}`,
        logging.Network
      )
      const isBotMsg = await intercept.isBotMsg(
        msg,
        true,
        sender,
        forwardedFromContactId
      )
      if (isBotMsg) {
        sphinxLogger.info(`[Network] => isBotMsg`, logging.Network)
        // return // DO NOT FORWARD TO TRIBE, forwarded to bot instead?
      }
    }

    // stop here if just me
    if (justMe) {
      if (success) success(true)
      return // if no contacts thats fine (like create public tribe)
    }

    if (!isTribeOwner) {
      // if tribe, send to owner only
      const tribeOwner = await models.Contact.findOne({
        where: { publicKey: chat.ownerPubkey, tenant },
      })
      contactIds = tribeOwner ? [tribeOwner.id] : []
    }
  } else {
    // not a tribe
    if (justMe) {
      if (success) success(true)
      return
    }
  }

  let yes: any = true
  let no: any = null

  sphinxLogger.info(
    `=> sending to ${contactIds.length} 'contacts'`,
    logging.Network
  )
  const batchItems = [];

  await asyncForEach(contactIds, async (contactId) => {
    // console.log("=> TENANT", tenant)
    if (contactId === tenant) {
      // dont send to self
      // console.log('=> dont send to self')
      return
    }

    const contact = await models.Contact.findOne({ where: { id: contactId } })
    if (!contact) {
      // console.log('=> sendMessage no contact')
      return // skip if u simply dont have the contact
    }
    if (tenant === -1) {
      // this is a bot sent from me!
      if (contact.isOwner) {
        // console.log('=> dont MQTT to myself!')
        return // dont MQTT to myself!
      }
    }

    // console.log("=> CONTACT", contactId, contact.publicKey)
    const destkey = contact.publicKey
    if (destkey === skipPubKey) {
      // console.log('=> skipPubKey', skipPubKey)
      return // skip (for tribe owner broadcasting, not back to the sender)
    }
    // console.log('-> sending to ', contact.id, destkey)

    let mqttTopic = networkType === 'mqtt-over-http' ? `${destkey}/${chatUUID}` : ''

    // sending a payment to one subscriber, buying a pic from OG poster
    // or boost to og poster
    // console.log("=> istribeOwner", isTribeOwner)
    // console.log("=> amount", amount)
    // console.log("=> realSatsContactId", realSatsContactId, contactId)
    if (isTribeOwner && amount && realSatsContactId === contactId) {
      mqttTopic = '' // FORCE KEYSEND!!!
    }

    const m = await personalizeMessage(msg, contact, isTribeOwner)
    // console.log('-> personalized msg', m)
    const opts = {
      dest: destkey,
      data: m,
      amt: Math.max(amount || 0, constants.min_sat_amount),
      route_hint: contact.routeHint || '',
    }

    // console.log("==> SENDER",sender)
    // console.log("==> OK SIGN AND SEND", opts);
    try {
      const r = await sign(opts, sender)
      batchItems.push({'mqttTopic': mqttTopic, 'data': r})
    } catch (e) {
      sphinxLogger.error(`KEYSEND ERROR ${e}`)
      no = e
    }
    await sleep(10)
  })

  await post(batchItems, chatUUID, "https://some.url/here")

  if (no) {
    if (failure) failure(no)
  } else {
    if (success) success(yes)
  }
}

export function sign(
  opts,
  owner: { [k: string]: any }
): Promise<string> {
  const ownerPubkey = owner.publicKey
  return new Promise(async function (resolve, reject) {
    if (!opts || typeof opts !== 'object') {
      return reject('object plz')
    }
    if (!opts.dest) {
      return reject('no dest pubkey')
    }
    let data = JSON.stringify(opts.data || {})
    opts.amt = opts.amt || 0

    const sig = await LND.signAscii(data, ownerPubkey)
    data = data + sig
      resolve(data)
  })
}

export async function post(
    batchItems,
    chatUUID: string,
    sphinxTribesUrl: string
) {
    const response = await fetch(sphinxTribesUrl, {
        method: 'POST',
        body: JSON.stringify({"chat_uuid": chatUUID, "batch_contents": batchItems}),
        headers: {'Content-Type': 'application/json; charset=UTF-8'}
    });
    if (!response.ok) {
        sphinxLogger.error(`Posting batch update to sphinx-tribes was not ok: ${response.statusText}`)
    }
}

export function newmsg(
  type,
  chat,
  sender,
  message,
  isForwarded: boolean,
  includeStatus?: boolean
): Msg {
  const includeGroupKey =
    type === constants.message_types.group_create ||
    type === constants.message_types.group_invite
  const includeAlias =
    sender && sender.alias && chat.type === constants.chat_types.tribe
  let aliasToInclude = sender.alias
  if (!isForwarded && includeAlias && chat.myAlias) {
    aliasToInclude = chat.myAlias
  }
  const includePhotoUrl =
    sender &&
    !sender.privatePhoto &&
    chat &&
    chat.type === constants.chat_types.tribe
  let photoUrlToInclude = sender.photoUrl || ''
  if (!isForwarded && includePhotoUrl && chat.myPhotoUrl) {
    photoUrlToInclude = chat.myPhotoUrl
  }
  if (!includeStatus && message.status) {
    delete message.status
  }
  return {
    type: type,
    chat: {
      uuid: chat.uuid,
      ...(chat.name && { name: chat.name }),
      ...((chat.type || chat.type === 0) && { type: chat.type }),
      ...(chat.members && { members: chat.members }),
      ...(includeGroupKey && chat.groupKey && { groupKey: chat.groupKey }),
      ...(includeGroupKey && chat.host && { host: chat.host }),
    },
    message: message,
    sender: {
      pub_key: sender.publicKey,
      ...(sender.routeHint && { route_hint: sender.routeHint }),
      alias: includeAlias ? aliasToInclude : '',
      role: sender.role || constants.chat_roles.reader,
      ...(includePhotoUrl && { photo_url: photoUrlToInclude }),
      // ...sender.contactKey && {contact_key: sender.contactKey}
    },
  }
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
