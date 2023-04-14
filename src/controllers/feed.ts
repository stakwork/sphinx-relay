import { models } from '../models'
import * as helpers from '../helpers'
import { failure, success } from '../utils/res'
import constants from '../constants'
import { sphinxLogger } from '../utils/logger'
import { Req } from '../types'

export interface ChatMeta {
  itemID: number
  ts: number
  sats_per_minute: number
  speed?: string
}

type DestinationType = 'wallet' | 'node'
export interface Destination {
  address: string
  route_hint: string
  split: number
  type: DestinationType
  custom_key: string
  custom_value: string
}

export const streamFeed = async (req: Req, res) => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const {
    destinations,
    amount,
    chat_id,
    text,
    update_meta,
  }: {
    destinations: Destination[]
    amount: number
    chat_id: number
    text: string
    update_meta: boolean
  } = req.body

  if (!(destinations && destinations.length)) {
    return failure(res, 'no destinations')
  }

  if (update_meta) {
    let meta
    try {
      meta = JSON.parse(text)
    } catch (e) {
      //we want to do nothing here
    }
    if (!meta) {
      return failure(res, 'no meta')
    }
    if (meta && meta.itemID) {
      const cm: ChatMeta = {
        itemID: meta.itemID,
        ts: meta.ts || 0,
        sats_per_minute: amount || 0,
        speed: meta.speed || '1',
      }
      const chat = await models.Chat.findOne({
        where: { id: chat_id, tenant },
      })
      if (!chat) {
        return failure(res, 'no chat')
      }
      await chat.update({ meta: JSON.stringify(cm) })
    }
  }

  const owner = req.owner

  if (amount && typeof amount === 'number') {
    await asyncForEach(destinations, async (d: Destination) => {
      if (d.type === 'node') {
        if (!d.address) return
        if (d.address.length !== 66) return
        if (d.address === owner.publicKey) return // dont send to self
        const extra_tlv = {}
        if (d.custom_key && d.custom_key) {
          extra_tlv[d.custom_key] = d.custom_value
        }
        const amt = Math.max(Math.round((d.split / 100) * amount), 1)
        await anonymousKeysend(
          owner,
          d.address,
          d.route_hint,
          amt,
          text,
          function () {},
          function () {},
          extra_tlv
        )
      }
    })
  }

  success(res, {})
}

export async function anonymousKeysend(
  owner,
  destination_key: string,
  route_hint: string,
  amount: number,
  text: string,
  onSuccess: ({ destination_key, amount }) => void,
  onFailure: (error) => void,
  extra_tlv: { [k: string]: string }
) {
  const tenant = owner.id
  const msg: { [k: string]: any } = {
    type: constants.message_types.keysend,
  }
  if (text) msg.message = { content: text }

  const date = new Date()
  date.setMilliseconds(0)
  const message = await models.Message.create({
    chatId: 0,
    type: constants.message_types.keysend,
    sender: tenant,
    amount,
    amountMsat: amount * 1000,
    paymentHash: '',
    date,
    messageContent: text || '',
    status: constants.statuses.confirmed,
    createdAt: date,
    updatedAt: date,
    tenant,
  })
  return helpers.performKeysendMessage({
    sender: owner,
    destination_key,
    route_hint,
    amount,
    msg,
    success: () => {
      sphinxLogger.info(`payment sent!`)
      onSuccess({ destination_key, amount })
    },
    failure: (error) => {
      let errMsg = ''
      if (typeof error === 'string') {
        errMsg = error
      } else {
        errMsg = error?.message
      }
      message.update({ error_message: errMsg })
      onFailure(error)
    },
    extra_tlv,
  })
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
