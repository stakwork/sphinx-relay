import {
  models,
  Invite,
  Contact,
  ContactRecord,
  InviteRecord,
  Chat,
} from '../models'
import * as crypto from 'crypto'
import * as jsonUtils from '../utils/json'
import { finishInviteInHub, createInviteInHub, payInviteInvoice } from '../hub'
// import * as proxy from '../utils/proxy'
import { failure } from '../utils/res'
import { sphinxLogger } from '../utils/logger'
import { Req } from '../types'
import { Response } from 'express'
import { loadConfig } from '../utils/config'
import { generateNewUser, getProxyRootPubkey, isProxy } from '../utils/proxy'
import * as Lightning from '../grpc/lightning'
import constants from '../constants'
import * as bolt11 from '@boltz/bolt11'
import * as socket from '../utils/socket'
import { sendNotification } from '../notify'

const config = loadConfig()

interface InvoiceRes {
  settled: boolean
  payment_request: string
  payment_hash: string
  preimage: string
  amount: number
}

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

async function checkSwarmInvitePaymentStatus() {
  try {
    const invites = (await models.Invite.findAll({
      where: { status: constants.invite_statuses.payment_pending },
    })) as InviteRecord[]
    const rootpk = await getProxyRootPubkey()
    for (let i = 0; i < invites.length; i++) {
      const invite = invites[i]
      const decoded_invoice = bolt11.decode(invite.invoice)
      if (decoded_invoice) {
        const paymentHash: string =
          (decoded_invoice.tags.find((t) => t.tagName === 'payment_hash')
            ?.data as string) || ''

        if (paymentHash) {
          const invoice = (await Lightning.getInvoiceHandler(
            paymentHash,
            rootpk
          )) as InvoiceRes
          if (invoice.settled) {
            //Update invite status to ready and create a new User by admin
            await finishSwarmInvite(invite)
          }
        }
      }
    }
  } catch (error) {
    console.log(error)
    sphinxLogger.error(`Error checking invite payment status`, error)
    throw error
  }
}

setInterval(async () => {
  try {
    await checkSwarmInvitePaymentStatus()
  } catch (error) {
    sphinxLogger.error(`error checking swarm invite Status ${error}`)
  }
}, 60000)

async function finishSwarmInvite(invite: InviteRecord) {
  try {
    const rootpk = await getProxyRootPubkey()
    const dbInvite = (await models.Invite.findOne({
      where: { inviteString: invite.inviteString },
    })) as InviteRecord

    const initialSat =
      config.swarm_invite_price -
      (config.swarm_invite_price * config.swarm_admin_invite_percentage) / 100
    const newUser = (await generateNewUser(rootpk, initialSat)) as ContactRecord
    const connection_string = `connect::${config.host_name}::${newUser.publicKey}`
    console.log(connection_string)
    const contact: Contact = (await models.Contact.findOne({
      where: { id: dbInvite.contactId },
    })) as Contact
    const owner: Contact = (await models.Contact.findOne({
      where: { id: dbInvite.tenant },
    })) as Contact
    // await dbInvite.update({ status: constants.invite_statuses.ready })

    socket.sendJson(
      {
        type: 'invite',
        response: jsonUtils.inviteToJson(dbInvite),
      },
      owner.id
    )

    if (contact) {
      sendNotification(new Chat(), contact.alias, 'invite', owner)
    }
  } catch (error) {
    sphinxLogger.error(`Error finishing up swarm invite ${error}`)
    throw error
  }
}
