import { models } from '../models'
import { Req } from '../types'
import { Response } from 'express'
import { success, failure } from '../utils/res'
import { asyncForEach } from '../helpers'
import constants from '../constants'

interface ReqBody {
  type: number
  meta_data: any
}

export async function saveAction(req: Req, res: Response) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { type, meta_data } = req.body
  const actionTypes = Object.keys(constants.action_types)
  if (typeof type !== 'number' || !actionTypes[type])
    return failure(res, 'invalid type')
  if (!meta_data) return failure(res, 'invalid meta_data')

  try {
    await models.ActionHistory.create({
      tenant,
      metaData: JSON.stringify(meta_data),
      actionType: type,
    })
    return success(res, 'Action saved successfully')
  } catch (error) {
    console.log(error)
    return failure(res, 'sorry an error occured')
  }
}

export async function saveActionBulk(req: Req, res: Response) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { data } = req.body
  const actionTypes = Object.keys(constants.action_types)
  if (!Array.isArray(data)) return failure(res, 'invalid data')
  if (data.length === 0)
    return failure(res, 'Please provide an array with contents')
  const insertAction = async (value: ReqBody) => {
    if (
      typeof value.type === 'number' &&
      actionTypes[value.type] &&
      value.meta_data
    ) {
      try {
        await models.ActionHistory.create({
          tenant,
          metaData: JSON.stringify(value.meta_data),
          actionType: value.type,
        })
      } catch (error) {
        console.log(error)
        throw error
      }
    } else {
      throw 'Please provide valid data'
    }
  }
  try {
    await asyncForEach(data, insertAction)
    return success(res, 'Data saved successfully')
  } catch (error) {
    console.log(error)
    return failure(res, error)
  }
}
