import * as crypto from 'crypto'
import { Op, FindOptions } from 'sequelize'
import * as moment from 'moment'
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
import * as socket from '../utils/socket'
import * as helpers from '../helpers'
import * as jsonUtils from '../utils/json'
import { success, failure } from '../utils/res'
import password from '../utils/password'
import constants from '../constants'
import * as tribes from '../utils/tribes'
import * as network from '../network'
import { Payload } from '../network'
import { isProxy, generateNewExternalUser } from '../utils/proxy'
import { logging, sphinxLogger } from '../utils/logger'
import * as rsa from '../crypto/rsa'
import { getAndDecryptTransportToken, getTransportKey } from '../utils/cert'
import { Req, Res } from '../types'
import { doJoinTribe } from './chatTribes'

export const getContacts = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const dontIncludeFromGroup =
    req.query.from_group && req.query.from_group === 'false'
  const includeUnmet = req.query.unmet && req.query.unmet === 'include'

  const where: {
    deleted: boolean
    tenant: number
    unmet?: { [Op.or]: [boolean, null] }
    fromGroup?: { [Op.or]: [boolean, null] }
  } = { deleted: false, tenant }
  if (dontIncludeFromGroup) {
    where.fromGroup = { [Op.or]: [false, null] }
  }
  if (!includeUnmet) {
    // this is the default
    where.unmet = { [Op.or]: [false, null] }
  }
  const contacts: ContactRecord[] = (await models.Contact.findAll({
    where,
    raw: true,
  })) as ContactRecord[]
  const invites: Invite[] = (await models.Invite.findAll({
    raw: true,
    where: { tenant },
  })) as Invite[]
  const chats: ChatRecord[] = (await models.Chat.findAll({
    where: { deleted: false, tenant },
    raw: true,
  })) as ChatRecord[]
  const subscriptions: Subscription[] = (await models.Subscription.findAll({
    raw: true,
    where: { tenant },
  })) as Subscription[]
  const pendingMembers: ChatMember[] = (await models.ChatMember.findAll({
    where: {
      status: constants.chat_statuses.pending,
      tenant,
    },
  })) as ChatMember[]

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

export const getContactsForChat = async (req: Req, res: Res): Promise<void> => {
  const chat_id = parseInt(req.params.chat_id)
  if (!chat_id) return failure(res, 'no chat id')
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const chat: ChatRecord = (await models.Chat.findOne({
    where: { id: chat_id, tenant },
  })) as ChatRecord
  if (!chat) return failure(res, 'chat not found')

  let contactIDs
  try {
    contactIDs = JSON.parse(chat.contactIds || '[]')
  } catch (e) {
    return failure(res, 'no contact ids')
  }
  const pendingMembers: ChatMember[] = (await models.ChatMember.findAll({
    where: {
      status: constants.chat_statuses.pending,
      chatId: chat_id,
      tenant,
    },
  })) as ChatMember[]

  if (!contactIDs || !contactIDs.length)
    return failure(res, 'no contact ids length')

  const limit = (req.query.limit && parseInt(req.query.limit as string)) || 1000
  const offset = (req.query.offset && parseInt(req.query.offset as string)) || 0
  const contacts: ContactRecord[] = (await models.Contact.findAll({
    where: { id: { [Op.in]: contactIDs }, tenant },
    limit,
    offset,
    order: [['alias', 'asc']],
  })) as ContactRecord[]
  if (!contacts) return failure(res, 'no contacts found')
  const contactsRet = contacts.map((c) => jsonUtils.contactToJson(c))

  let finalContacts = contactsRet
  if (offset === 0) {
    const pendingContactIDs = (pendingMembers || []).map((cm) => cm.contactId)
    const pendingContacts: ContactRecord[] = (await models.Contact.findAll({
      where: { id: { [Op.in]: pendingContactIDs }, tenant },
      order: [['alias', 'asc']],
    })) as ContactRecord[]
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
  res: Res
): Promise<void> {
  if (!isProxy()) {
    return failure(res, 'only proxy')
  }
  const { pubkey, sig } = req.body
  const where: { isOwner: boolean; publicKey: string } = {
    isOwner: true,
    publicKey: pubkey,
  }
  const owner: Contact = (await models.Contact.findOne({
    where,
  })) as Contact
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
  const created: Contact = (await models.Contact.create(contact)) as Contact
  // set tenant to self!
  created.update({ tenant: created.id })
  success(res, { id: (created && created.id) || 0 })
}

export const generateToken = async (req: Req, res: Res): Promise<void> => {
  sphinxLogger.info([
    '=> generateToken called',
    {
      body: req.body,
      params: req.params,
      query: req.query,
    },
  ])

  const where: { isOwner: boolean; publicKey?: string } = { isOwner: true }

  const pubkey = req.body['pubkey']
  if (isProxy()) {
    if (!pubkey) {
      return failure(res, 'no pubkey')
    }
    where.publicKey = pubkey
  }
  const owner: Contact = (await models.Contact.findOne({
    where,
  })) as Contact
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
    const decrypted = await getAndDecryptTransportToken(xTransportToken)
    token = decrypted.token
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
    let isAdmin = true
    if (isProxy()) {
      const theAdmin = (await models.Contact.findOne({
        where: { isAdmin: true },
      })) as Contact
      // there can be only 1 admin
      if (theAdmin) {
        isAdmin = false
      }
      tribes.newSubscription(owner, network.receiveMqttMessage)
    }
    if (isAdmin) {
      sphinxLogger.info('Admin signing up!!!')
    }
    await owner.update({ authToken: hash, isAdmin })
  }

  success(res, {
    id: (owner && owner.id) || 0,
  })
}

async function joinDefaultTribes(owner: Contact, admin: Contact) {
  const defaultTribes = (await models.Chat.findAll({
    where: { defaultJoin: true },
  })) as Chat[]
  await helpers.asyncForEach(defaultTribes, async (t) => {
    const body = {
      uuid: t.uuid,
      group_key: t.groupKey,
      name: t.name,
      amount: t.priceToJoin,
      img: t.photoUrl,
      owner_pubkey: t.ownerPubkey,
      private: t.private,
      owner_route_hint: admin.routeHint,
      owner_alias: admin.alias,
    }
    await doJoinTribe(body, owner)
  })
}

export const registerHmacKey = async (req: Req, res: Res): Promise<void> => {
  if (!req.body.encrypted_key) {
    return failure(res, 'no encrypted_key found')
  }
  const transportTokenKey = await getTransportKey()
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

export const getHmacKey = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const hmac: string = req.owner.hmacKey
  if (!hmac) return failure(res, 'no hmac set')
  const contact_key = req.owner.contactKey
  if (!contact_key) return failure(res, 'no contact_key')
  const encrypted_key = rsa.encrypt(contact_key, hmac)
  if (!encrypted_key) return failure(res, 'failed to encrypt hmac key')
  success(res, {
    encrypted_key,
  })
}

export const updateContact = async (req: Req, res: Res): Promise<void> => {
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

  const contact: Contact = (await models.Contact.findOne({
    where: { id: req.params.id, tenant },
  })) as Contact
  if (!contact) {
    return failure(res, 'no contact found')
  }

  const contactKeyChanged =
    attrs['contact_key'] && contact.contactKey !== attrs['contact_key']
  const aliasChanged = attrs['alias'] && contact.alias !== attrs['alias']
  const photoChanged =
    attrs['photo_url'] && contact.photoUrl !== attrs['photo_url']
  const isTheSignup = attrs['contact_key'] && !contact.contactKey

  // update contact
  const owner = await contact.update(jsonUtils.jsonToContact(attrs))
  success(res, jsonUtils.contactToJson(owner))

  // first time creating contact key: auto join tribes now

  if (isTheSignup && isProxy()) {
    console.log('=> first contact_key set! isTheSignup', tenant)
    const theAdmin = (await models.Contact.findOne({
      where: { isAdmin: true },
    })) as Contact
    if (theAdmin) {
      await joinDefaultTribes(owner, theAdmin)
    }
  }

  if (!contact.isOwner) return
  if (!(attrs['contact_key'] || attrs['alias'] || attrs['photo_url'])) {
    return // skip if not at least one of these
  }
  if (!(contactKeyChanged || aliasChanged || photoChanged)) {
    return
  }

  // send updated owner info to others!
  const contactIds: number[] = (
    (await models.Contact.findAll({
      where: { deleted: false, tenant },
    })) as Contact[]
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

export const exchangeKeys = async (req: Req, res: Res): Promise<void> => {
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

  const contact: Contact = (await models.Contact.findOne({
    where: { id: req.params.id, tenant },
  })) as Contact
  const owner = req.owner

  success(res, jsonUtils.contactToJson(contact))

  helpers.sendContactKeys({
    contactIds: [contact.id],
    sender: owner,
    type: constants.message_types.contact_key,
  })
}

export const createContact = async (req: Req, res: Res): Promise<void> => {
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

  let existing: Contact | undefined = undefined
  if (attrs['public_key']) {
    existing = (await models.Contact.findOne({
      where: { publicKey: attrs['public_key'], tenant },
    })) as Contact
  }
  if (existing) {
    const updateObj: { fromGroup: boolean; alias?: string } = {
      fromGroup: false,
    }
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

  if (attrs['public_key'] && attrs['public_key'].length > 66)
    attrs['public_key'] = attrs['public_key'].substring(0, 66)
  attrs.tenant = tenant

  const createdContact: Contact = (await models.Contact.create(
    attrs
  )) as Contact
  const contact = await createdContact.update(jsonUtils.jsonToContact(attrs))

  success(res, jsonUtils.contactToJson(contact))

  helpers.sendContactKeys({
    contactIds: [contact.id],
    sender: owner,
    type: constants.message_types.contact_key,
  })
}

export const deleteContact = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const id = parseInt(req.params.id || '0')
  if (!id || id === tenant) {
    failure(res, 'Cannot delete self')
    return
  }

  const contact: Contact = (await models.Contact.findOne({
    where: { id, tenant },
  })) as Contact
  if (!contact) return

  // CHECK IF IN MY TRIBE
  const owner = req.owner
  const tribesImAdminOf: Chat[] = (await models.Chat.findAll({
    where: { ownerPubkey: owner.publicKey, tenant },
  })) as Chat[]
  const tribesIdArray =
    tribesImAdminOf &&
    tribesImAdminOf.length &&
    tribesImAdminOf.map((t) => t.id)
  let okToDelete = true
  if (tribesIdArray && tribesIdArray.length) {
    const thisContactMembers: ChatMember[] = (await models.ChatMember.findAll({
      where: { contactId: id, chatId: { [Op.in]: tribesIdArray }, tenant },
    })) as ChatMember[]
    if (thisContactMembers && thisContactMembers.length) {
      // IS A MEMBER! dont delete, instead just set from_group=true
      okToDelete = false
      await contact.update({ fromGroup: true })
    }
  }

  // CHECK IF IM IN THEIR TRIBE
  const tribesTheyreAdminOf: Chat[] = (await models.Chat.findAll({
    where: { ownerPubkey: contact.publicKey, tenant, deleted: false },
  })) as Chat[]
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
  const chats: Chat[] = (await models.Chat.findAll({
    where: { deleted: false, tenant },
  })) as Chat[]
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

  const sender: Contact = (await models.Contact.findOne({
    where: {
      publicKey: sender_pub_key,
      status: constants.contact_statuses.confirmed,
      tenant,
    },
  })) as Contact
  let msgIncludedContactKey = false // ???????
  if (sender_contact_key) {
    msgIncludedContactKey = true
  }
  if (sender) {
    const objToUpdate: {
      contactKey?: string
      alias?: string
      photoUrl?: string
    } = {}
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

  const sender: Contact = (await models.Contact.findOne({
    where: {
      publicKey: sender_pub_key,
      status: constants.contact_statuses.confirmed,
      tenant,
    },
  })) as Contact
  if (sender_contact_key && sender) {
    const objToUpdate: {
      alias?: string
      photoUrl?: string
      contactKey: string
    } = {
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

function extractAttrs(body): {
  public_key?: string
  node_alias?: string
  alias?: string
  photo_url?: string
  device_id?: number
  status?: string
  contact_key?: string
  from_group?: boolean
  private_photo?: string
  notification_sound?: boolean
  tip_amount?: number
  route_hint?: string
  price_to_meet?: number
  push_kit_token?: string
  tenant?: number
  prune?: number
} {
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
    'push_kit_token',
    'prune',
  ]
  const attrs = {}
  Object.keys(body).forEach((key) => {
    if (fields_to_update.includes(key)) {
      attrs[key] = body[key]
    }
  })
  return attrs
}

export const getLatestContacts = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  try {
    const dateToReturn = decodeURI(req.query.date as string)
    /* eslint-disable import/namespace */
    const local = moment.utc(dateToReturn).local().toDate()

    const where: { tenant: number; updatedAt: { [Op.gte]: Date } } = {
      updatedAt: { [Op.gte]: local },
      tenant,
    }

    const clause: FindOptions = { where }
    const limit = req.query.limit && parseInt(req.query.limit as string)
    const offset = req.query.offset && parseInt(req.query.offset as string)
    if ((limit || limit === 0) && (offset || offset === 0)) {
      clause.limit = limit
      clause.offset = offset
    }
    const contacts: Contact[] = (await models.Contact.findAll(
      clause
    )) as Contact[]

    const invites: Invite[] = (await models.Invite.findAll(clause)) as Invite[]

    const chats: ChatRecord[] = (await models.Chat.findAll(
      clause
    )) as ChatRecord[]

    const subscriptions: Subscription[] = (await models.Subscription.findAll(
      clause
    )) as Subscription[]

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
    const pendingMembers: ChatMember[] = (await models.ChatMember.findAll({
      where: {
        status: constants.chat_statuses.pending,
        tenant,
        chatId: { [Op.in]: chatIds },
      },
    })) as ChatMember[]

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
  res: Res,
  tenant: number,
  id: number,
  blocked: boolean
) {
  const contact: Contact = (await models.Contact.findOne({
    where: { id, tenant },
  })) as Contact
  if (!contact) {
    return failure(res, 'no contact found')
  }
  // update contact
  const updated = await contact.update({ blocked })
  success(res, jsonUtils.contactToJson(updated))
}

export const blockContact = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const contactId = parseInt(req.params.contact_id as string)
  switchBlock(res, req.owner.id, contactId, true)
}

export const unblockContact = async (req: Req, res: Res): Promise<void> => {
  if (!req.owner) return failure(res, 'no owner')
  const contactId = parseInt(req.params.contact_id as string)
  switchBlock(res, req.owner.id, contactId, false)
}
