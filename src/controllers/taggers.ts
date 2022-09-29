import { Req } from '../types'
import { Response } from 'express'
import { failure, success } from '../utils/res'
import * as Lightning from '../grpc/lightning'

export const payTagger = async (
  req: Req,
  res: Response
): Promise<void | Response> => {
  if (!req.owner) return failure(res, 'no owner')
  const { amount, destination } = req.body
  if (typeof amount !== 'number' && typeof destination !== 'string')
    return failure(res, 'Invalid data provided')
  try {
    const keysendPayment = await Lightning.keysend({
      amt: 5,
      dest: destination,
    })
    console.log(keysendPayment)
    return success(res, keysendPayment)
  } catch (e) {
    console.log(e)
    return failure(res, 'An error occured')
  }
}
