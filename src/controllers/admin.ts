import * as crypto from 'crypto'
import { success, failure } from '../utils/res'
import { Req, Res } from '../types'
import * as json from '../utils/json'
import { generateNewUser, getProxyRootPubkey, isProxy } from '../utils/proxy'
import { models, ContactRecord, Chat, Contact } from '../models'
import constants from '../constants'
import * as Lightning from '../grpc/lightning'

export const swarmAdminRegister = async (req: Req, res: Res): Promise<void> => {
  const pubkey = req.body['pubkey'] as string
  if (!pubkey) {
    return failure(res, 'no pubkey')
  }
  const owner: Contact = (await models.Contact.findOne({
    where: { isOwner: true, publicKey: pubkey },
  })) as Contact
  if (!owner) {
    return failure(res, 'no owner')
  }

  const token = req.body['token'] as string
  if (!token) {
    return failure(res, 'no token in body')
  }
  const hash = crypto.createHash('sha256').update(token).digest('base64')

  if (owner.adminToken) {
    if (owner.adminToken !== hash) {
      return failure(res, 'invalid admin token')
    }
  } else {
    await owner.update({ adminToken: hash, isAdmin: true })
  }

  success(res, {
    id: (owner && owner.id) || 0,
  })
}

export async function hasAdmin(req: Req, res: Res): Promise<void> {
  if (!isProxy()) return failure(res, 'not proxy')
  try {
    const admin: ContactRecord = (await models.Contact.findOne({
      where: {
        isOwner: true,
        isAdmin: true,
      },
    })) as ContactRecord
    success(res, admin ? true : false)
  } catch (e) {
    failure(res, e)
  }
}

// this is needed for the initial admin token generation
export async function initialAdminPubkey(req: Req, res: Res): Promise<void> {
  if (!isProxy()) return failure(res, 'not proxy')
  try {
    const contacts = (await models.Contact.findAll()) as ContactRecord[]
    if (contacts.length !== 1) return failure(res, 'too late' + contacts.length)
    const admin = contacts[0]
    if (admin.authToken || admin.contactKey) return failure(res, 'too late')
    const pubkey = admin.publicKey
    success(res, { pubkey })
  } catch (e) {
    failure(res, e)
  }
}

export async function addDefaultJoinTribe(req: Req, res: Res): Promise<void> {
  if (!req.admin) return failure(res, 'no owner')
  if (!req.admin.isAdmin) return failure(res, 'not admin')
  if (!isProxy()) return failure(res, 'not proxy')

  const id = parseInt(req.params.id)
  if (!id) return failure(res, 'no id specified')
  try {
    const chat = (await models.Chat.findOne({
      where: { id, tenant: req.admin.id },
    })) as Chat
    if (!chat) return failure(res, 'chat not found')
    await chat.update({ defaultJoin: true })
    success(res, true)
  } catch (e) {
    failure(res, e)
  }
}

export async function removeDefaultJoinTribe(
  req: Req,
  res: Res
): Promise<void> {
  if (!req.admin) return failure(res, 'no owner')
  if (!req.admin.isAdmin) return failure(res, 'not admin')
  if (!isProxy()) return failure(res, 'not proxy')

  const id = parseInt(req.params.id)
  if (!id) return failure(res, 'no id specified')
  try {
    const chat = (await models.Chat.findOne({
      where: { id, tenant: req.admin.id },
    })) as Chat
    if (!chat) return failure(res, 'chat not found')
    await chat.update({ defaultJoin: false })
    success(res, true)
  } catch (e) {
    failure(res, e)
  }
}

export async function addProxyUser(req: Req, res: Res): Promise<void> {
  if (!req.admin) return failure(res, 'no owner')
  if (!req.admin.isAdmin) return failure(res, 'not admin')
  if (!isProxy()) return failure(res, 'not proxy')

  try {
    const initial_sat = parseInt(req.query.sats as string)
    console.log('-> addProxyUser initial sats', initial_sat)
    const rpk = await getProxyRootPubkey()
    const created = await generateNewUser(rpk, initial_sat || 0)
    if (created) success(res, json.contactToJson(created))
    else failure(res, 'failed to create new proxy user')
  } catch (e) {
    failure(res, e)
  }
}

export async function listUsers(req: Req, res: Res): Promise<void> {
  if (!req.admin) return failure(res, 'no owner')
  if (!req.admin.isAdmin) return failure(res, 'not admin')
  if (!isProxy()) return failure(res, 'not proxy')

  try {
    const users: ContactRecord[] = (await models.Contact.findAll({
      where: {
        isOwner: true,
      },
    })) as ContactRecord[]
    success(res, { users: users.map((u) => json.contactToJson(u)) })
  } catch (e) {
    failure(res, e)
  }
}

export async function listTribes(req: Req, res: Response): Promise<void> {
  if (!req.admin) return failure(res, 'no owner')
  const tenant: number = req.admin.id
  const chats: Chat[] = (await models.Chat.findAll({
    where: { deleted: false, tenant, type: constants.chat_types.tribe },
    raw: true,
  })) as Chat[]
  const c = chats.map((chat) => json.chatToJson(chat))
  success(res, c)
}

export async function adminBalance(req: Req, res: Res): Promise<void> {
  if (!req.admin) return failure(res, 'no owner')
  res.status(200)
  try {
    const blcs = await Lightning.complexBalances(req.admin.publicKey)
    res.json({
      success: true,
      response: blcs,
    })
  } catch (e) {
    res.json({ success: false })
  }
  res.end()
}
