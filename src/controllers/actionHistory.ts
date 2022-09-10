import { models } from '../models'
import { Req } from '../types'
import { Response } from 'express'
import { success, failure } from '../utils/res'

export async function saveAction(req: Req, res: Response) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { type, meta_data } = req.body
  if (!type) return failure(res, 'invalid type')
  if (!meta_data) return failure(res, 'invalid meta_data')

  try {
    await models.ActionHistory.create({
      tenant,
      metaData: JSON.stringify(meta_data),
      type,
    })
    return success(res, 'Action saved successfully')
  } catch (error) {
    console.log(error)
    return
  }
}
