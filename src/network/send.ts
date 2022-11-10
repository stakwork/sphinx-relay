import {
  models,
  Chat,
  ContactRecord,
  Contact,
  ChatMember as ChatMemberModel,
  ChatMemberRecord,
} from '../models'
import * as LND from '../grpc/lightning'
import { personalizeMessage, decryptMessage } from '../utils/msg'
import * as tribes from '../utils/tribes'
import { tribeOwnerAutoConfirmation } from '../controllers/confirmations'
import { typesToForward } from './receive'
import * as intercept from './intercept'
import constants from '../constants'
import { logging, sphinxLogger } from '../utils/logger'
import { Msg, MessageContent, ChatMember } from './interfaces'
import { loadConfig } from '../utils/config'
import * as people from '../utils/people'

const config = loadConfig()

type NetworkType = undefined | 'mqtt' | 'lightning'

export interface ChatPlusMembers extends Chat {
  members?: { [k: string]: ChatMember }
}

export interface SendMessageParams {
  type: number
  chat: Partial<ChatPlusMembers>
  message: Partial<MessageContent>
  sender: Partial<ContactRecord | Contact>
  amount?: number
  success?: (data: any) => void
  failure?: (error: any) => void
  skipPubKey?: string
  isForwarded?: boolean
  forwardedFromContactId?: number
  realSatsContactId?: number
}

export async function sendMessage({
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
}: SendMessageParams): Promise<void> {
  if (!chat || !sender) return
  const tenant: number = sender.id as number
  if (!tenant) return

  const isTribe = chat.type === constants.chat_types.tribe
  const isTribeOwner = isTribe && sender.publicKey === chat.ownerPubkey
  // console.log('-> sender.publicKey', sender.publicKey)
  // console.log('-> chat.ownerPubkey', chat.ownerPubkey)

  let aSender = sender
  if ((sender as ContactRecord).dataValues) {
    aSender = (sender as ContactRecord).dataValues
  }
  const theSender: ContactRecord = aSender as ContactRecord
  // let theSender: ContactRecord = (sender.dataValues || sender) as ContactRecord
  if (isTribeOwner && !isForwarded) {
    theSender.role = constants.chat_roles.owner
  }
  let msg = newmsg(type, chat, theSender, message, isForwarded ? true : false)

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
  let mentionContactIds: number[] = []
  if (isTribe) {
    if (type === constants.message_types.confirmation) {
      // if u are owner, go ahead!
      if (!isTribeOwner) return // dont send confs for tribe if not owner
    }
    if (isTribeOwner) {
      networkType = 'mqtt' // broadcast to all
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
      if (isBotMsg === true) {
        sphinxLogger.info(`[Network] => isBotMsg`, logging.Network)
        // return // DO NOT FORWARD TO TRIBE, forwarded to bot instead?
      }
      mentionContactIds = await detectMentions(
        msg,
        isForwarded ? true : false,
        chat.id as number,
        tenant
      )
    }

    // stop here if just me
    if (justMe) {
      if (success) success(true)
      return // if no contacts thats fine (like create public tribe)
    }

    if (isTribeOwner) {
      try {
        // post last_active to tribes server
        if (chat.uuid && chat.host) {
          tribes.putActivity(chat.uuid, chat.host, sender.publicKey)
        }
      } catch (e) {
        sphinxLogger.error('failed to tribes.putActivity', logging.Network)
      }
    } else {
      // if tribe, send to owner only
      const tribeOwner: Contact = (await models.Contact.findOne({
        where: { publicKey: chat.ownerPubkey as string, tenant },
      })) as Contact
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
  await asyncForEach(contactIds, async (contactId) => {
    // console.log("=> TENANT", tenant)
    if (contactId === tenant) {
      // dont send to self
      // console.log('=> dont send to self')
      return
    }

    const contact: Contact = (await models.Contact.findOne({
      where: { id: contactId },
    })) as Contact
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

    let mqttTopic = networkType === 'mqtt' ? `${destkey}/${chatUUID}` : ''

    // sending a payment to one subscriber, buying a pic from OG poster
    // or boost to og poster
    // console.log("=> istribeOwner", isTribeOwner)
    // console.log("=> amount", amount)
    // console.log("=> realSatsContactId", realSatsContactId, contactId)
    if (isTribeOwner && amount && realSatsContactId === contactId) {
      mqttTopic = '' // FORCE KEYSEND!!!
      try {
        const receiver = (await models.ChatMember.findOne({
          where: {
            contactId: contactId,
            tenant,
            chatId: chat.id!,
          },
        })) as ChatMemberRecord
        await receiver?.update({
          totalEarned: receiver.totalEarned + amount,
        })
      } catch (error) {
        sphinxLogger.error(
          `=> Could not update the totalEarned column on the ChatMember table for Leadership board record ${error}`,
          logging.Network
        )
      }
    }

    const m = await personalizeMessage(msg, contact, isTribeOwner)

    // send a "push", the user was mentioned
    if (
      mentionContactIds.includes(contact.id) ||
      mentionContactIds.includes(Infinity)
    ) {
      m.message.push = true
    }
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
      const r = await signAndSend(opts, sender, mqttTopic)
      yes = r
    } catch (e) {
      sphinxLogger.error(`KEYSEND ERROR ${e}`)
      no = e
    }
    await sleep(10)
  })
  if (no) {
    if (failure) failure(no)
  } else {
    if (success) success(yes)
  }
}

export interface SignAndSendOpts {
  amt?: number
  dest: string
  route_hint?: string
  data: Partial<Msg>
}

export function signAndSend(
  opts: SignAndSendOpts,
  owner: { [k: string]: any },
  mqttTopic?: string,
  replayingHistory?: boolean
): Promise<boolean> {
  // console.log('sign and send!',opts)
  const ownerPubkey = owner.publicKey
  const ownerID = owner.id
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

    // console.log("-> ACTUALLY SEND: topic:", mqttTopic)
    try {
      if (mqttTopic) {
        await tribes.publish(mqttTopic, data, ownerPubkey, () => {
          if (!replayingHistory) {
            if (mqttTopic) checkIfAutoConfirm(opts.data, ownerID)
          }
        })
      } else {
        await LND.keysendMessage(
          { ...opts, data } as LND.KeysendOpts,
          ownerPubkey
        )
      }
      resolve(true)
    } catch (e) {
      reject(e)
    }
  })
}

function checkIfAutoConfirm(data, tenant) {
  if (typesToForward.includes(data.type)) {
    if (data.type === constants.message_types.delete) {
      return // dont auto confirm delete msg
    }
    tribeOwnerAutoConfirmation(data.message.id, data.chat.uuid, tenant)
  }
}

export function newmsg(
  type: number,
  chat: Partial<ChatPlusMembers>,
  sender: ContactRecord,
  message: Partial<MessageContent>,
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
  console.log('PERSONUUID in newmsg', sender.personUuid)
  const result: Msg = {
    type: type,
    chat: {
      uuid: chat.uuid as string,
      ...(chat.name && { name: chat.name }),
      ...((chat.type || chat.type === 0) && { type: chat.type }),
      ...(chat.members && { members: chat.members }),
      ...(includeGroupKey && chat.groupKey && { groupKey: chat.groupKey }),
      ...(includeGroupKey && chat.host && { host: chat.host }),
    },
    message: message as MessageContent,
    sender: {
      pub_key: sender.publicKey,
      ...(sender.routeHint && { route_hint: sender.routeHint }),
      ...(sender.personUuid && {
        person: `${config.people_host}/${sender.personUuid}`,
      }),
      alias: includeAlias ? aliasToInclude : '',
      role: sender.role || constants.chat_roles.reader,
      ...(includePhotoUrl && { photo_url: photoUrlToInclude }),
      // ...sender.contactKey && {contact_key: sender.contactKey}
    },
  }
  const personId = people.getPersonId()
  if (personId) {
    result.sender.person = config.people_host + '/' + personId
    sphinxLogger.info(
      `[+] person host full URL  ${result.sender.person}`,
      logging.Network
    )
    return result
  }
  return result
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// function urlBase64FromHex(ascii){
//     return Buffer.from(ascii,'hex').toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
// }
// function urlBase64FromBytes(buf){
//     return Buffer.from(buf).toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
// }

async function detectMentions(
  msg: Msg,
  isForwarded: boolean,
  chatId: number,
  tenant: number
): Promise<number[]> {
  const content = msg.message.content as string
  if (!content) return []
  if (!content.includes('@')) return []
  const mentions = parseMentions(content)
  if (mentions.includes('@all') && !isForwarded) return [Infinity]
  const ret: number[] = []
  const allMembers: ChatMemberModel[] = (await models.ChatMember.findAll({
    where: { tenant, chatId },
  })) as ChatMemberModel[]
  await asyncForEach(mentions, async (men) => {
    const lastAlias = men.substring(1)
    // check chat memberss
    const member = allMembers.find((m) => {
      if (m.lastAlias && lastAlias) {
        return compareAliases(m.lastAlias, lastAlias)
      }
    })
    if (member) {
      ret.push(member.contactId)
    }
  })
  return ret
}

function parseMentions(content: string) {
  // split on space or newline
  const words = content.split(/\n| /)
  return words.filter((w) => w.startsWith('@'))
}

export async function detectMentionsForTribeAdminSelf(
  msg: Msg,
  mainAlias?: string,
  aliasInChat?: string
): Promise<boolean> {
  const content = msg.message.content as string
  if (!content) return false
  const mentions = parseMentions(content)
  if (mentions.includes('@all')) return true
  let ret = false
  await asyncForEach(mentions, async (men) => {
    const lastAlias = men.substring(1)
    if (lastAlias) {
      if (aliasInChat) {
        // admin's own alias for tribe
        if (compareAliases(aliasInChat, lastAlias)) {
          ret = true
        }
      } else if (mainAlias) {
        // or owner's default alias
        if (compareAliases(mainAlias, lastAlias)) {
          ret = true
        }
      }
    }
  })
  return ret
}

// alias1 can have spaces, so remove them
// then comparse to lower case
function compareAliases(alias1: string, alias2: string): boolean {
  const pieces = alias1.split(' ')
  let match = false
  pieces.forEach((p) => {
    if (p && alias2) {
      if (p.toLowerCase() === alias2.toLowerCase()) {
        match = true
      }
    }
  })
  return match
}
