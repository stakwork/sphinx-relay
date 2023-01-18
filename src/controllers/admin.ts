import { success, failure } from '../utils/res'
import { Req, Res } from '../types'
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

export async function addDefaultJoinTribe(req: Req, res: Res): Promise<void> {
  if (!req.owner) return failure(res, 'no owner')
  if (!req.owner.isAdmin) return failure(res, 'not admin')
  if (!isProxy()) return failure(res, 'not proxy')

  const id = parseInt(req.params.id)
  if (!id) return failure(res, 'no id specified')
  try {
    const chat = (await models.Chat.findOne({
      where: { id },
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
      where: { id },
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
    const rpk = await getProxyRootPubkey()
    const created = await generateNewUser(rpk)
    success(res, created)
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
    success(res, { users })
  } catch (e) {
    failure(res, e)
  }
}
