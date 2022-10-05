import { Req } from '../types'
import { Response } from 'express'
import { failure, success } from '../utils/res'
import * as Lightning from '../grpc/lightning'
import { models } from '../models'

interface BoostTagger {
  amount: number
  pubkey: string
  ref_id: string
  tenant: number
}

export const payTagger = async (
  req: Req,
  res: Response
): Promise<void | Response> => {
  if (!req.owner) return failure(res, 'no owner')
  const { amount, destination, ref_id, timestamp } = req.body
  if (
    typeof amount !== 'number' &&
    typeof destination !== 'string' &&
    typeof ref_id !== 'string' &&
    typeof timestamp !== 'string'
  )
    return failure(res, 'Invalid data provided')
  const tenant: number = req.owner.id
  try {
    await Lightning.keysend({
      amt: amount,
      dest: destination,
    })
    await models.Tagger.create({
      tenant,
      amount,
      pubkey: destination,
      type: 'stream',
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
      pubkey: destination,
      type: 'stream',
      refId: ref_id,
      timestamp,
      status: 0,
    })
    return failure(res, 'An error occured')
  }
}

export const boostTagger = async ({
  ref_id,
  pubkey,
  amount,
  tenant,
}: BoostTagger): Promise<boolean> => {
  try {
    await Lightning.keysend({
      amt: amount,
      dest: pubkey,
    })
    await models.Tagger.create({
      tenant,
      amount,
      pubkey,
      type: 'boost',
      refId: ref_id,
      status: 1,
    })
    return true
  } catch (error) {
    console.log(error)
    await models.Tagger.create({
      tenant,
      amount,
      pubkey: pubkey,
      type: 'boost',
      refId: ref_id,
      status: 0,
    })
    return false
  }
}
