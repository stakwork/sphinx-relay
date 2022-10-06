import { Req } from '../types'
import { Response } from 'express'
import { failure, success } from '../utils/res'
import * as Lightning from '../grpc/lightning'
import { models } from '../models'

export const payTagger = async (
  req: Req,
  res: Response
): Promise<void | Response> => {
  if (!req.owner) return failure(res, 'no owner')
  const { amount, pubkey, ref_id, timestamp, type } = req.body

  if (!amount && !pubkey && !ref_id && !type) {
    return failure(res, 'Invalid data provided')
  }

  if (
    typeof amount !== 'number' &&
    typeof pubkey !== 'string' &&
    typeof ref_id !== 'string' &&
    typeof timestamp !== 'string' &&
    typeof type != 'string'
  )
    return failure(res, 'Invalid data provided')

  if (pubkey.length !== 66) {
    return failure(res, 'Invalid Public Key')
  }
  const tenant: number = req.owner.id
  try {
    await Lightning.keysend({
      amt: amount,
      dest: pubkey,
    })
    await models.Tagger.create({
      tenant,
      amount,
      pubkey,
      type,
      refId: ref_id,
      timestamp,
      status: 1,
    })
    return success(res, 'Payment Successful')
  } catch (e) {
    console.log(e)
    await models.Tagger.create({
      tenant,
      amount,
      pubkey,
      type,
      refId: ref_id,
      timestamp,
      status: 0,
    })
    return failure(res, 'An error occured')
  }
}
