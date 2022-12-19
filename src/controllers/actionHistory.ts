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

/**

    @param {Req} req
    @param {Response} res
    @returns {Promise<void>}
    */
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

/**
 * This function saves an action to the database.

@param {Req} req - The request object containing information about the request made to the server.
@param {Response} res - The response object used to send a response back to the client.

@return {Promise<void>} - A promise that resolves when the function completes, or rejects if an error occurs. If successful, the response will contain a message indicating that the action was saved successfully. If there is an error, the response will contain an error message.
*/
export async function saveActionBulk(req: Req, res: Response) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { data } = req.body
  console.log(JSON.stringify(data))
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
