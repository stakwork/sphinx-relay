import { models, Contact, Invite, Chat } from './models'
import fetch from 'node-fetch'
import { Op } from 'sequelize'
import * as socket from './utils/socket'
import * as jsonUtils from './utils/json'
import * as helpers from './helpers'
import { nodeinfo, NodeType } from './utils/nodeinfo'
import * as Lightning from './grpc/lightning'
import constants from './constants'
import { loadConfig } from './utils/config'
import * as https from 'https'
import { isProxy } from './utils/proxy'
import {
  sendNotification,
  resetNotifyTribeCount,
  sendVoipNotification,
} from './notify'
import { logging, sphinxLogger } from './utils/logger'

const pingAgent = new https.Agent({
  keepAlive: true,
})
const checkInvitesAgent = new https.Agent({
  keepAlive: true,
})

const env = process.env.NODE_ENV || 'development'
const config = loadConfig()

const checkInviteHub = async (params = {}) => {
  if (env != 'production') {
    return
  }
  //console.log('[hub] checking invites ping')

  const inviteStrings: string[] = (
    (await models.Invite.findAll({
      where: {
        status: {
          [Op.notIn]: [
            constants.invite_statuses.complete,
            constants.invite_statuses.expired,
          ],
        },
      },
    })) as Invite[]
  ).map((invite) => invite.inviteString)
  if (inviteStrings.length === 0) {
    return // skip if no invites
  }

  fetch(config.hub_api_url + '/invites/check', {
    agent: checkInvitesAgent,
    method: 'POST',
    body: JSON.stringify({ invite_strings: inviteStrings }),
    headers: { 'Content-Type': 'application/json' },
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.object) {
        json.object.invites.map(async (object) => {
          const invite = object.invite
          const pubkey = object.pubkey
          const routeHint = object.route_hint
          const price = object.price

          const dbInvite: Invite = (await models.Invite.findOne({
            where: { inviteString: invite.pin },
          })) as Invite
          const contact: Contact = (await models.Contact.findOne({
            where: { id: dbInvite.contactId },
          })) as Contact
          const owner: Contact = (await models.Contact.findOne({
            where: { id: dbInvite.tenant },
          })) as Contact

          if (dbInvite.status != invite.invite_status) {
            const updateObj: { [k: string]: any } = {
              status: invite.invite_status,
              price: price,
            }
            if (invite.invoice) updateObj.invoice = invite.invoice

            await dbInvite.update(updateObj)

            socket.sendJson(
              {
                type: 'invite',
                response: jsonUtils.inviteToJson(dbInvite),
              },
              owner.id
            )

            if (dbInvite.status == constants.invite_statuses.ready && contact) {
              sendNotification(new Chat(), contact.alias, 'invite', owner)
            }
          }

          if (
            pubkey &&
            dbInvite.status == constants.invite_statuses.complete &&
            contact
          ) {
            const updateObj: { [k: string]: any } = {
              publicKey: pubkey,
              status: constants.contact_statuses.confirmed,
            }
            if (routeHint) updateObj.routeHint = routeHint
            await contact.update(updateObj)

            const contactJson = jsonUtils.contactToJson(contact)
            contactJson.invite = jsonUtils.inviteToJson(dbInvite)

            socket.sendJson(
              {
                type: 'contact',
                response: contactJson,
              },
              owner.id
            )

            helpers.sendContactKeys({
              contactIds: [contact.id],
              sender: owner,
              type: constants.message_types.contact_key,
            })
          }
        })
      }
    })
    .catch((error) => {
      sphinxLogger.error(`[hub error] ${error}`)
    })
}

const pingHub = async (params = {}) => {
  if (env != 'production' || config.dont_ping_hub === 'true') {
    return
  }

  const node = await nodeinfo()
  sendHubCall({ ...params, node })

  if (isProxy()) {
    // send all "clean" nodes
    massPingHubFromProxies(node)
  }
}

async function massPingHubFromProxies(rn) {
  // real node
  const owners = await models.Contact.findAll({
    where: {
      isOwner: true,
      id: { [Op.ne]: 1 },
    },
  })
  const nodes: { [k: string]: any }[] = []
  const channelList = await Lightning.listChannels({})
  if (!channelList) return sphinxLogger.error('failed to listChannels')
  const { channels } = channelList
  const localBalances = channels.map((c) => parseInt(c.local_balance))
  const remoteBalances = channels.map((c) => parseInt(c.remote_balance))
  const largestLocalBalance = Math.max(...localBalances)
  const largestRemoteBalance = Math.max(...remoteBalances)
  const totalLocalBalance = localBalances.reduce((a, b) => a + b, 0)
  await asyncForEach(owners, async (o: Contact) => {
    const clean = o.authToken === null || o.authToken === ''
    nodes.push({
      pubkey: o.publicKey,
      node_type: NodeType.NODE_VIRTUAL,
      clean,
      last_active: o.lastActive,
      route_hint: o.routeHint,
      relay_commit: rn?.relay_commit,
      lnd_version: rn?.lnd_version,
      relay_version: rn?.relay_version,
      testnet: rn?.testnet,
      ip: rn?.ip,
      public_ip: rn?.public_ip,
      node_alias: rn?.node_alias,
      number_channels: channels.length,
      open_channel_data: channels,
      largest_local_balance: largestLocalBalance,
      largest_remote_balance: largestRemoteBalance,
      total_local_balance: totalLocalBalance,
    })
  })
  if (logging.Proxy) {
    const cleanNodes = nodes.filter((n) => n.clean)
    sphinxLogger.info(
      `pinging hub with ${nodes.length} total nodes, ${cleanNodes.length} clean nodes`,
      logging.Proxy
    )
  }
  // split into chunks of 50
  const size = 50
  for (let i = 0; i < nodes.length; i += size) {
    await sendHubCall(
      {
        nodes: nodes.slice(i, i + size),
      },
      true
    )
  }
}

async function sendHubCall(body, mass?: boolean) {
  try {
    // console.log("=> PING BODY", body)
    if (!mass) console.log('=> pingHub', body)

    const r = await fetch(
      config.hub_api_url + (mass ? '/mass_ping' : '/ping'),
      {
        agent: pingAgent,
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }
    )
    const j = await r.json()
    if (!mass) console.log('=> PING RESPONSE', j)
    if (!(j && j.status && j.status === 'ok')) {
      sphinxLogger.info(`[hub] ping returned not ok ${j}`)
    }
  } catch (e) {
    sphinxLogger.error(`[hub warning]: cannot reach hub ${e}`)
  }
}

const pingHubInterval = (ms) => {
  setInterval(pingHub, ms)
}

const checkInvitesHubInterval = (ms) => {
  setInterval(checkInviteHub, ms)
}

export function sendInvoice(payReq, amount) {
  sphinxLogger.info(`[hub] sending invoice`)
  fetch(config.hub_api_url + '/invoices', {
    method: 'POST',
    body: JSON.stringify({ invoice: payReq, amount }),
    headers: { 'Content-Type': 'application/json' },
  }).catch((error) => {
    sphinxLogger.error(`[hub error]: sendInvoice ${error}`)
  })
}

const finishInviteInHub = (params, onSuccess, onFailure) => {
  fetch(config.hub_api_url + '/invites/finish', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  })
    .then((res) => res.json())
    .then((json) => {
      sphinxLogger.info(`[hub] finished invite to hub`)
      onSuccess(json)
    })
    .catch((e) => {
      sphinxLogger.error(`[hub] fail to finish invite in hub`)
      onFailure(e)
    })
}

const payInviteInHub = (invite_string, params, onSuccess, onFailure) => {
  fetch(config.hub_api_url + '/invites/' + invite_string + '/pay', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.object) {
        sphinxLogger.info(`[hub] finished pay to hub`)
        onSuccess(json)
      } else {
        sphinxLogger.error(`[hub] fail to pay invite in hub`)
        onFailure(json)
      }
    })
}

async function payInviteInvoice(invoice, pubkey: string, onSuccess, onFailure) {
  try {
    const res = Lightning.sendPayment(invoice, pubkey)
    onSuccess(res)
  } catch (e) {
    onFailure(e)
  }
}

const createInviteInHub = (params, onSuccess, onFailure) => {
  fetch(config.hub_api_url + '/invites_new', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.object) {
        sphinxLogger.info(`[hub] sent invite to be created to hub`)
        onSuccess(json)
      } else {
        sphinxLogger.error(`[hub] fail to create invite in hub`)
        onFailure(json)
      }
    })
}

export async function getAppVersionsFromHub() {
  try {
    const r = await fetch(config.hub_api_url + '/app_versions', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const j = await r.json()
    return j
  } catch (e) {
    return null
  }
}

export {
  pingHubInterval,
  checkInvitesHubInterval,
  sendHubCall,
  sendNotification,
  createInviteInHub,
  finishInviteInHub,
  payInviteInHub,
  payInviteInvoice,
  resetNotifyTribeCount,
  sendVoipNotification,
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
