import { success, failure } from '../utils/res'
import { Req, Res } from '../types'
import { generateNewUser, getProxyRootPubkey, isProxy } from '../utils/proxy'
import { models, ContactRecord } from '../models'

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
