import {
  Contact,
  ContactRecord,
  Invite,
  Chat,
  ChatRecord,
  Subscription,
  ChatMember,
  models,
} from '../models'
import * as crypto from 'crypto'
import * as socket from '../utils/socket'
import * as helpers from '../helpers'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import password from '../utils/password'
import { Op } from 'sequelize'
import constants from '../constants'
import * as tribes from '../utils/tribes'
import * as network from '../network'
import { Payload } from '../network'
import { isProxy, generateNewExternalUser } from '../utils/proxy'
import { logging, sphinxLogger } from '../utils/logger'
import * as moment from 'moment'
import * as rsa from '../crypto/rsa'
import * as fs from 'fs'
import { loadConfig } from '../utils/config'
import { Req } from '../types'

import { Response } from 'express'

const config = loadConfig()

export const getContacts = async (req: Req, res: Response): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const dontIncludeFromGroup =
    req.query.from_group && req.query.from_group === 'false'
  const includeUnmet = req.query.unmet && req.query.unmet === 'include'

  const where: { [k: string]: any } = { deleted: false, tenant }
  if (dontIncludeFromGroup) {
    where.fromGroup = { [Op.or]: [false, null] }
  }
  if (!includeUnmet) {
    // this is the default
    where.unmet = { [Op.or]: [false, null] }
  }
  const contacts = (await models.Contact.findAll({
    where,
    raw: true,
  })) as unknown as Contact[]
  const invites = (await models.Invite.findAll({
    raw: true,
    where: { tenant },
  })) as unknown as Invite[]
  const chats = (await models.Chat.findAll({
    where: { deleted: false, tenant },
    raw: true,
  })) as unknown as ChatRecord[]
  const subscriptions = (await models.Subscription.findAll({
    raw: true,
    where: { tenant },
  })) as unknown as Subscription[]
  const pendingMembers = (await models.ChatMember.findAll({
    where: {
      status: constants.chat_statuses.pending,
      tenant,
    },
  })) as unknown as ChatMember[]

  const contactsResponse = contacts.map((contact) => {
    const contactJson = jsonUtils.contactToJson(contact)
    const invite = invites.find((invite) => invite.contactId == contact.id)

    if (invite) {
      contactJson.invite = jsonUtils.inviteToJson(invite)
    }

    return contactJson
  })

  const subsResponse = subscriptions.map((s) => jsonUtils.subscriptionToJson(s))
  const chatsResponse = chats.map((chat) => {
    const theChat = (chat.dataValues as Chat) || chat
    if (!pendingMembers) return jsonUtils.chatToJson(theChat)
    const membs = pendingMembers.filter((m) => m.chatId === chat.id) || []
    const pendingContactIds = membs.map((m) => m.contactId)

    return jsonUtils.chatToJson({ ...theChat, pendingContactIds })
  })

  success(res, {
    contacts: contactsResponse,
    chats: chatsResponse,
    subscriptions: subsResponse,
  })
}

export const getContactsForChat = async (
  req: Req,
  res: Response
): Promise<void> => {
  const chat_id = parseInt(req.params.chat_id)
  if (!chat_id) return failure(res, 'no chat id')
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const chat = (await models.Chat.findOne({
    where: { id: chat_id, tenant },
  })) as unknown as Chat
  if (!chat) return failure(res, 'chat not found')

  let contactIDs
  try {
    contactIDs = JSON.parse(chat.contactIds || '[]')
  } catch (e) {
    return failure(res, 'no contact ids')
  }
  const pendingMembers = (await models.ChatMember.findAll({
    where: {
      status: constants.chat_statuses.pending,
      chatId: chat_id,
      tenant,
    },
  })) as unknown as ChatMember[]

  if (!contactIDs || !contactIDs.length)
    return failure(res, 'no contact ids length')

  const limit = (req.query.limit && parseInt(req.query.limit as string)) || 1000
  const offset = (req.query.offset && parseInt(req.query.offset as string)) || 0
  const contacts = (await models.Contact.findAll({
    where: { id: { [Op.in]: contactIDs }, tenant },
    limit,
    offset,
    order: [['alias', 'asc']],
  })) as unknown as Contact[]
  if (!contacts) return failure(res, 'no contacts found')
  const contactsRet = contacts.map((c) => jsonUtils.contactToJson(c))

  let finalContacts = contactsRet
  if (offset === 0) {
    const pendingContactIDs = (pendingMembers || []).map((cm) => cm.contactId)
    const pendingContacts = (await models.Contact.findAll({
      where: { id: { [Op.in]: pendingContactIDs }, tenant },
      order: [['alias', 'asc']],
    })) as unknown as ContactRecord[]
    if (pendingContacts) {
      const pendingContactsRet = pendingContacts.map((c) => {
        const ctc = c.dataValues as Contact
        const contactJson = jsonUtils.contactToJson(ctc)
        contactJson.pending = true
        return contactJson
      })
      finalContacts = pendingContactsRet.concat(contactsRet)
    }
  }

  success(res, { contacts: finalContacts })
}

export async function generateOwnerWithExternalSigner(
  req: Req,
  res: Response
): Promise<void> {
  if (!isProxy()) {
    return failure(res, 'only proxy')
  }
  const { pubkey, sig } = req.body
  const where: { [k: string]: any } = { isOwner: true, publicKey: pubkey }
  const owner = (await models.Contact.findOne({ where })) as unknown as Contact
  if (owner) {
    return failure(res, 'owner already exists')
  }

  const generated = await generateNewExternalUser(pubkey, sig)
  if (!generated) {
    return failure(res, 'generate failed')
  }
  const contact = {
    publicKey: generated.publicKey,
    routeHint: generated.routeHint,
    isOwner: true,
    authToken: null,
  }
  const created = (await models.Contact.create(contact)) as unknown as Contact
  // set tenant to self!
  created.update({ tenant: created.id })
  success(res, { id: (created && created.id) || 0 })
}

export const generateToken = async (req: Req, res: Response): Promise<void> => {
  sphinxLogger.info([
    '=> generateToken called',
    {
      body: req.body,
      params: req.params,
      query: req.query,
    },
  ])

  const where: { [k: string]: any } = { isOwner: true }

  const pubkey = req.body['pubkey']
  if (isProxy()) {
    if (!pubkey) {
      return failure(res, 'no pubkey')
    }
    where.publicKey = pubkey
  }
  const owner = (await models.Contact.findOne({ where })) as unknown as Contact
  if (!owner) {
    return failure(res, 'no owner')
  }

  const pwd = password
  if (process.env.USE_PASSWORD === 'true') {
    if (pwd !== req.query.pwd) {
      failure(res, 'Wrong Password')
      return
    } else {
      sphinxLogger.info('PASSWORD ACCEPTED!')
    }
  }

  let token = ''
  const xTransportToken = req.headers['x-transport-token']
  if (typeof xTransportToken !== 'string') {
    token = req.body['token']
  } else {
    const transportTokenKeys = fs.readFileSync(
      config.transportPrivateKeyLocation,
      'utf8'
    )
    const tokenAndTimestamp = rsa
      .decrypt(transportTokenKeys, xTransportToken)
      .split('|')
    token = tokenAndTimestamp[0]
  }

  if (!token) {
    return failure(res, 'no token in body')
  }
  const hash = crypto.createHash('sha256').update(token).digest('base64')

  if (owner.authToken) {
    if (owner.authToken !== hash) {
      return failure(res, 'invalid token')
    }
  } else {
    // done!
    if (isProxy()) {
      tribes.subscribe(`${pubkey}/#`, network.receiveMqttMessage) // add MQTT subsription
    }
    owner.update({ authToken: hash })
  }

  success(res, {
    id: (owner && owner.id) || 0,
  })
}

export const registerHmacKey = async (req: Req, res) => {
  if (!req.body.encrypted_key) {
    return failure(res, 'no encrypted_key found')
  }
  const transportTokenKey = fs.readFileSync(
    config.transportPrivateKeyLocation,
    'utf8'
  )
  const hmacKey = rsa.decrypt(transportTokenKey, req.body.encrypted_key)
  if (!hmacKey) {
    return failure(res, 'no decrypted hmac key')
  }
  const tenant: number = req.owner.id
  await models.Contact.update({ hmacKey }, { where: { tenant, isOwner: true } })

  success(res, {
    registered: true,
  })
}

export const updateContact = async (req: Req, res: Response): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  sphinxLogger.info(
    [
      '=> updateContact called',
      {
        body: req.body,
        params: req.params,
        query: req.query,
      },
    ],
    logging.Network
  )

  const attrs = extractAttrs(req.body)

  const contact = (await models.Contact.findOne({
    where: { id: req.params.id, tenant },
  })) as unknown as Contact
  if (!contact) {
    return failure(res, 'no contact found')
  }

  const contactKeyChanged =
    attrs['contact_key'] && contact.contactKey !== attrs['contact_key']
  const aliasChanged = attrs['alias'] && contact.alias !== attrs['alias']
  const photoChanged =
    attrs['photo_url'] && contact.photoUrl !== attrs['photo_url']

  // update contact
  const owner = await contact.update(jsonUtils.jsonToContact(attrs))
  success(res, jsonUtils.contactToJson(owner))

  if (!contact.isOwner) return
  if (!(attrs['contact_key'] || attrs['alias'] || attrs['photo_url'])) {
    return // skip if not at least one of these
  }
  if (!(contactKeyChanged || aliasChanged || photoChanged)) {
    return
  }

  // send updated owner info to others!
  const contactIds = (
    (await models.Contact.findAll({
      where: { deleted: false, tenant },
    })) as unknown as Contact[]
  )
    .filter((c) => c.id !== tenant && c.publicKey)
    .map((c) => c.id)
  if (contactIds.length == 0) return

  sphinxLogger.info(['=> send contact_key to', contactIds])
  helpers.sendContactKeys({
    contactIds: contactIds,
    sender: owner,
    type: constants.message_types.contact_key,
    dontActuallySendContactKey: !contactKeyChanged,
  })
}

export const exchangeKeys = async (req: Req, res: Response): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  sphinxLogger.info(
    [
      '=> exchangeKeys called',
      {
        body: req.body,
        params: req.params,
        query: req.query,
      },
    ],
    logging.Network
  )

  const contact = (await models.Contact.findOne({
    where: { id: req.params.id, tenant },
  })) as unknown as Contact
  const owner = req.owner

  success(res, jsonUtils.contactToJson(contact))

  helpers.sendContactKeys({
    contactIds: [contact.id],
    sender: owner,
    type: constants.message_types.contact_key,
  })
}

export const createContact = async (req: Req, res: Response): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  sphinxLogger.info(
    [
      '=> createContact called',
      {
        body: req.body,
        params: req.params,
        query: req.query,
      },
    ],
    logging.Network
  )

  const attrs = extractAttrs(req.body)

  const owner = req.owner

  const existing =
    attrs['public_key'] &&
    ((await models.Contact.findOne({
      where: { publicKey: attrs['public_key'], tenant },
    })) as unknown as Contact)
  if (existing) {
    const updateObj: { [k: string]: any } = { fromGroup: false }
    if (attrs['alias']) updateObj.alias = attrs['alias']
    await existing.update(updateObj)
    // retry the key exchange
    if (!existing.contactKey) {
      helpers.sendContactKeys({
        contactIds: [existing.id],
        sender: owner,
        type: constants.message_types.contact_key,
      })
    }
    return success(res, jsonUtils.contactToJson(existing))
  }

  if (attrs['public_key'].length > 66)
    attrs['public_key'] = attrs['public_key'].substring(0, 66)
  attrs.tenant = tenant

  const createdContact = (await models.Contact.create(
    attrs
  )) as unknown as Contact
  const contact = await createdContact.update(jsonUtils.jsonToContact(attrs))

  success(res, jsonUtils.contactToJson(contact))

  helpers.sendContactKeys({
    contactIds: [contact.id],
    sender: owner,
    type: constants.message_types.contact_key,
  })
}

export const deleteContact = async (req: Req, res: Response): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const id = parseInt(req.params.id || '0')
  if (!id || id === tenant) {
    failure(res, 'Cannot delete self')
    return
  }

  const contact = (await models.Contact.findOne({
    where: { id, tenant },
  })) as unknown as Contact
  if (!contact) return

  // CHECK IF IN MY TRIBE
  const owner = req.owner
  const tribesImAdminOf = (await models.Chat.findAll({
    where: { ownerPubkey: owner.publicKey, tenant },
  })) as unknown as Chat[]
  const tribesIdArray =
    tribesImAdminOf &&
    tribesImAdminOf.length &&
    tribesImAdminOf.map((t) => t.id)
  let okToDelete = true
  if (tribesIdArray && tribesIdArray.length) {
    const thisContactMembers = (await models.ChatMember.findAll({
      where: { contactId: id, chatId: { [Op.in]: tribesIdArray }, tenant },
    })) as unknown as ChatMember[]
    if (thisContactMembers && thisContactMembers.length) {
      // IS A MEMBER! dont delete, instead just set from_group=true
      okToDelete = false
      await contact.update({ fromGroup: true })
    }
  }

  // CHECK IF IM IN THEIR TRIBE
  const tribesTheyreAdminOf = (await models.Chat.findAll({
    where: { ownerPubkey: contact.publicKey, tenant, deleted: false },
  })) as unknown as Chat[]
  if (tribesTheyreAdminOf && tribesTheyreAdminOf.length) {
    okToDelete = false
    await contact.update({ fromGroup: true })
  }

  if (okToDelete) {
    await contact.update({
      deleted: true,
      publicKey: '',
      photoUrl: '',
      alias: 'Unknown',
      contactKey: '',
    })
  }

  // find and destroy chat & messages
  const chats = (await models.Chat.findAll({
    where: { deleted: false, tenant },
  })) as unknown as Chat[]
  chats.map(async (chat) => {
    if (chat.type === constants.chat_types.conversation) {
      const contactIds = JSON.parse(chat.contactIds)
      if (contactIds.includes(id)) {
        await chat.update({
          deleted: true,
          uuid: '',
          contactIds: '[]',
          name: '',
        })
        await models.Message.destroy({ where: { chatId: chat.id, tenant } })
      }
    }
  })
  await models.Invite.destroy({ where: { contactId: id, tenant } })
  await models.Subscription.destroy({ where: { contactId: id, tenant } })

  success(res, {})
}

export const receiveContactKey = async (payload: Payload): Promise<void> => {
  const dat = payload
  const sender_pub_key = dat.sender.pub_key
  const sender_route_hint = dat.sender.route_hint
  const sender_contact_key = dat.sender.contact_key
  const sender_alias = dat.sender.alias || 'Unknown'
  const sender_photo_url = dat.sender.photo_url
  const owner = payload.owner
  const tenant: number = owner.id

  sphinxLogger.info(
    ['=> received contact key from', sender_pub_key, tenant],
    logging.Network
  )

  if (!sender_pub_key) {
    return sphinxLogger.error('no pubkey!')
  }

  const sender = (await models.Contact.findOne({
    where: {
      publicKey: sender_pub_key,
      status: constants.contact_statuses.confirmed,
      tenant,
    },
  })) as unknown as Contact
  let msgIncludedContactKey = false // ???????
  if (sender_contact_key) {
    msgIncludedContactKey = true
  }
  if (sender) {
    const objToUpdate: { [k: string]: any } = {}
    if (sender_contact_key) objToUpdate.contactKey = sender_contact_key
    if (sender_alias) objToUpdate.alias = sender_alias
    if (sender_photo_url) objToUpdate.photoUrl = sender_photo_url
    if (Object.keys(objToUpdate).length) {
      await sender.update(objToUpdate)
    }

    socket.sendJson(
      {
        type: 'contact',
        response: jsonUtils.contactToJson(sender),
      },
      tenant
    )
  } else {
    sphinxLogger.info('DID NOT FIND SENDER')
  }

  if (msgIncludedContactKey) {
    helpers.sendContactKeys({
      contactPubKey: sender_pub_key,
      routeHint: sender_route_hint,
      contactIds: sender ? [sender.id] : [],
      sender: owner,
      type: constants.message_types.contact_key_confirmation,
    })
  }
}

export const receiveConfirmContactKey = async (
  payload: Payload
): Promise<void> => {
  sphinxLogger.info([
    `=> confirm contact key for ${payload.sender && payload.sender.pub_key}`,
    JSON.stringify(payload),
  ])

  const dat = payload
  const sender_pub_key = dat.sender.pub_key
  const sender_contact_key = dat.sender.contact_key
  const sender_alias = dat.sender.alias || 'Unknown'
  const sender_photo_url = dat.sender.photo_url
  const owner = dat.owner
  const tenant: number = owner.id

  if (!sender_pub_key) {
    return sphinxLogger.error('no pubkey!')
  }

  const sender = (await models.Contact.findOne({
    where: {
      publicKey: sender_pub_key,
      status: constants.contact_statuses.confirmed,
      tenant,
    },
  })) as unknown as Contact
  if (sender_contact_key && sender) {
    const objToUpdate: { [k: string]: any } = {
      contactKey: sender_contact_key,
    }
    if (sender_alias) objToUpdate.alias = sender_alias
    if (sender_photo_url) objToUpdate.photoUrl = sender_photo_url
    await sender.update(objToUpdate)

    socket.sendJson(
      {
        type: 'contact',
        response: jsonUtils.contactToJson(sender),
      },
      tenant
    )
  }
}

function extractAttrs(body): { [k: string]: any } {
  const fields_to_update = [
    'public_key',
    'node_alias',
    'alias',
    'photo_url',
    'device_id',
    'status',
    'contact_key',
    'from_group',
    'private_photo',
    'notification_sound',
    'tip_amount',
    'route_hint',
    'price_to_meet',
  ]
  const attrs = {}
  Object.keys(body).forEach((key) => {
    if (fields_to_update.includes(key)) {
      attrs[key] = body[key]
    }
  })
  return attrs
}

export const getLatestContacts = async (
  req: Req,
  res: Response
): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  try {
    const dateToReturn = decodeURI(req.query.date as string)
    const local = moment.utc(dateToReturn).local().toDate()
    const where: { [k: string]: any } = {
      updatedAt: { [Op.gte]: local },
      tenant,
    }
    const contacts = (await models.Contact.findAll({
      where,
    })) as unknown as Contact[]
    const invites = (await models.Invite.findAll({
      where,
    })) as unknown as Invite[]
    const chats = (await models.Chat.findAll({
      where,
    })) as unknown as ChatRecord[]
    const subscriptions = (await models.Subscription.findAll({
      where,
    })) as unknown as Subscription[]

    const contactsResponse = contacts.map((contact) =>
      jsonUtils.contactToJson(contact)
    )
    const invitesResponse = invites.map((invite) =>
      jsonUtils.inviteToJson(invite)
    )
    const subsResponse = subscriptions.map((s) =>
      jsonUtils.subscriptionToJson(s)
    )
    // const chatsResponse = chats.map((chat) => jsonUtils.chatToJson(chat));
    const chatIds = chats.map((c) => c.id)
    const pendingMembers = (await models.ChatMember.findAll({
      where: {
        status: constants.chat_statuses.pending,
        tenant,
        chatId: { [Op.in]: chatIds },
      },
    })) as unknown as ChatMember[]
    const chatsResponse = chats.map((chat) => {
      const theChat = (chat.dataValues as Chat) || chat
      if (!pendingMembers) return jsonUtils.chatToJson(theChat)
      const membs = pendingMembers.filter((m) => m.chatId === chat.id) || []
      const pendingContactIds = membs.map((m) => m.contactId)

      return jsonUtils.chatToJson({ ...theChat, pendingContactIds })
    })

    success(res, {
      contacts: contactsResponse,
      invites: invitesResponse,
      chats: chatsResponse,
      subscriptions: subsResponse,
    })
  } catch (e) {
    failure(res, e)
  }
}

async function switchBlock(
  res: any,
  tenant: number,
  id: number,
  blocked: boolean
) {
  const contact = (await models.Contact.findOne({
    where: { id, tenant },
  })) as unknown as Contact
  if (!contact) {
    return failure(res, 'no contact found')
  }
  // update contact
  const updated = await contact.update({ blocked })
  success(res, jsonUtils.contactToJson(updated))
}

export const blockContact = async (req: Req, res) => {
  if (!req.owner) return failure(res, 'no owner')
  const contactId = parseInt(req.params.contact_id as string)
  switchBlock(res, req.owner.id, contactId, true)
}

export const unblockContact = async (req: Req, res) => {
  if (!req.owner) return failure(res, 'no owner')
  const contactId = parseInt(req.params.contact_id as string)
  switchBlock(res, req.owner.id, contactId, false)
}
