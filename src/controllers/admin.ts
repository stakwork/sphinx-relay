import { success, failure } from '../utils/res'
import { Req, Res } from '../types'
import * as json from '../utils/json'
import { generateNewUser, getProxyRootPubkey, isProxy } from '../utils/proxy'
import { models, ContactRecord, Chat } from '../models'

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
  if (!req.owner) return failure(res, 'no owner')
  if (!req.owner.isAdmin) return failure(res, 'not admin')
  if (!isProxy()) return failure(res, 'not proxy')

  const id = parseInt(req.params.id)
  if (!id) return failure(res, 'no id specified')
  try {
    const chat = (await models.Chat.findOne({
      where: { id, tenant: req.owner.id },
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
  if (!req.owner) return failure(res, 'no owner')
  if (!req.owner.isAdmin) return failure(res, 'not admin')
  if (!isProxy()) return failure(res, 'not proxy')

  const id = parseInt(req.params.id)
  if (!id) return failure(res, 'no id specified')
  try {
    const chat = (await models.Chat.findOne({
      where: { id, tenant: req.owner.id },
    })) as Chat
    if (!chat) return failure(res, 'chat not found')
    await chat.update({ defaultJoin: false })
    success(res, true)
  } catch (e) {
    failure(res, e)
  }
}

export async function addProxyUser(req: Req, res: Res): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  if (!req.owner.isAdmin) return failure(res, 'not admin')
  if (!isProxy()) return failure(res, 'not proxy')

  try {
    const initial_sat = parseInt(req.query.sats as string)
    console.log('-> addProxyUser initial sats', initial_sat)
    const rpk = await getProxyRootPubkey()
    const created = await generateNewUser(rpk, initial_sat || 0)
    if (created) success(res, created)
    else failure(res, 'failed to create new proxy user')
  } catch (e) {
    failure(res, e)
  }
}

export async function listUsers(req: Req, res: Res): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  if (!req.owner.isAdmin) return failure(res, 'not admin')
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
