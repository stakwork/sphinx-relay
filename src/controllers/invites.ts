import { models, Invite, Contact, ContactRecord, InviteRecord } from '../models'
import * as crypto from 'crypto'
import * as jsonUtils from '../utils/json'
import { finishInviteInHub, createInviteInHub, payInviteInvoice } from '../hub'
// import * as proxy from '../utils/proxy'
import { failure } from '../utils/res'
import { sphinxLogger } from '../utils/logger'
import { Req } from '../types'
import { Response } from 'express'
import { loadConfig } from '../utils/config'
import { getProxyRootPubkey, isProxy } from '../utils/proxy'
import * as Lightning from '../grpc/lightning'
import constants from '../constants'

const config = loadConfig()

export const finishInvite = async (
  req: Req,
  res: Response
): Promise<void | Response> => {
  const { invite_string } = req.body
  const params = {
    invite: {
      pin: invite_string,
    },
  }

  function onSuccess() {
    res.status(200)
    res.json({ success: true })
    res.end()
  }
  function onFailure() {
    res.status(200)
    res.json({ success: false })
    res.end()
  }

  finishInviteInHub(params, onSuccess, onFailure)
}

export const payInvite = async (
  req: Req,
  res: Response
): Promise<void | Response> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const invite_string = req.params['invite_string']
  try {
    const dbInvite: Invite = (await models.Invite.findOne({
      where: { inviteString: invite_string, tenant },
    })) as Invite

    const onSuccess = async (response) => {
      // const invite = response.object
      // console.log("response", invite)
      // if (dbInvite.status != invite.invite_status) {
      // 	dbInvite.update({ status: invite.invite_status })
      // }
      if (response.payment_error) {
        sphinxLogger.error(`=> payInvite ERROR ${response.payment_error}`)
        res.status(200)
        res.json({ success: false, error: response.payment_error })
        res.end()
      } else {
        res.status(200)
        res.json({
          success: true,
          response: { invite: jsonUtils.inviteToJson(dbInvite) },
        })
        res.end()
      }
    }

    const onFailure = (response) => {
      sphinxLogger.error(`=> payInvite ERROR ${response}`)
      res.status(200)
      res.json({ success: false })
      res.end()
    }

    // payInviteInHub(invite_string, params, onSuccess, onFailure)
    payInviteInvoice(
      dbInvite.invoice,
      req.owner.publicKey,
      onSuccess,
      onFailure
    )
  } catch (error) {
    sphinxLogger.error(`=> payInvite ERROR ${error}`)
    return failure(res, error)
  }
}

export const createInvite = async (
  req: Req,
  res: Response
): Promise<void | Response> => {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { nickname, welcome_message } = req.body

  const owner = req.owner

  const params = {
    invite: {
      nickname: owner.alias,
      pubkey: owner.publicKey,
      route_hint: owner.routeHint,
      contact_nickname: nickname,
      message: welcome_message,
      pin: crypto.randomBytes(20).toString('hex'),
    },
  }

  const onSuccess = async (response) => {
    sphinxLogger.info(`response ${response}`)

    const inviteCreated = response.object

    const contact: Contact = (await models.Contact.create({
      alias: nickname,
      status: 0,
      tenant,
    })) as Contact
    const invite = await models.Invite.create({
      welcomeMessage: inviteCreated.message,
      contactId: contact.id,
      status: inviteCreated.invite_status,
      inviteString: inviteCreated.pin,
      tenant,
      // invoice: inviteCreated.invoice,
    })
    const contactJson = jsonUtils.contactToJson(contact)
    if (invite) {
      contactJson.invite = jsonUtils.inviteToJson(invite)
    }

    res.status(200)
    res.json({ success: true, contact: contactJson })
    res.end()
  }

  const onFailure = (response) => {
    res.status(200)
    res.json(response)
    res.end()
  }

  if (config.allow_swarm_invite && isProxy()) {
    createInviteSwarm(params, tenant, res)
  } else {
    createInviteInHub(params, onSuccess, onFailure)
  }
}

async function createInviteSwarm(params, tenant, res: Response) {
  // pending: 0,
  // ready: 1,
  // delivered: 2,
  // in_progress: 3,
  // complete: 4,
  // expired: 5,
  // payment_pending: 6,
  console.log(params.invite)
  try {
    const rootpk = await getProxyRootPubkey()
    const payment = await Lightning.addInvoice(
      { memo: 'payment for invite', value: config.swarm_invite_price },
      rootpk
    )
    const contact: Contact = (await models.Contact.create({
      alias: params.invite.contact_nickname,
      status: 0,
      tenant,
    })) as ContactRecord
    const invite = (await models.Invite.create({
      welcomeMessage: params.invite.message,
      contactId: contact.id,
      status: constants.invite_statuses.payment_pending,
      inviteString: params.invite.pin,
      tenant,
      invoice: payment.payment_request,
      price: config.swarm_invite_price,
    })) as InviteRecord

    const contactJson = jsonUtils.contactToJson(contact)
    if (invite) {
      contactJson.invite = jsonUtils.inviteToJson(invite)
    }

    res.status(200)
    res.json({ success: true, contact: contactJson })
    res.end()
  } catch (error) {
    sphinxLogger.error(`=> create swarm invite ERROR ${error}`)
    return failure(res, error)
  }
}
