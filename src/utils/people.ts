import { loadConfig } from './config'
import { genSignedTimestamp } from './tribes'
import fetch from 'node-fetch'
import { sphinxLogger, logging } from './logger'
import { Lsat } from 'lsat-js'
import * as Lightning from '../grpc/lightning'
import { SendPaymentResponse } from '../grpc/interfaces'

interface UpdateTribeBadge {
  tribeId: string
  owner_pubkey: string
  action: string
  badge: string
  tribe_host: string
}

interface reissueOnLiquid {
  amount: number
  owner_pubkey: string
  badge_id: number
}

const config = loadConfig()

export async function createOrEditPerson(
  {
    host,
    owner_alias,
    owner_pubkey,
    owner_route_hint,
    owner_contact_key,
    description,
    img,
    tags,
    price_to_meet,
    extras,
    new_ticket_time,
    uuid,
  },
  id?: number
) {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(protocol + '://' + host + '/person?token=' + token, {
      method: 'POST',
      body: JSON.stringify({
        ...(id && { id }), // id optional (for editing)
        owner_alias,
        owner_pubkey,
        owner_route_hint,
        owner_contact_key,
        description,
        img,
        tags: tags || [],
        price_to_meet: price_to_meet || 0,
        extras: extras || {},
        new_ticket_time: new_ticket_time || 0,
        uuid,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!r.ok) {
      throw 'failed to create or edit person ' + r.status
    }
    const person = await r.json()
    return person
  } catch (e) {
    sphinxLogger.error('unauthorized to create person', logging.Tribes)
    throw e
  }
}

export async function deletePerson(host, id, owner_pubkey) {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(`${protocol}://${host}/person/${id}?token=${token}`, {
      method: 'DELETE',
    })
    if (!r.ok) {
      throw 'failed to delete person ' + r.status
    }
    // const j = await r.json()
  } catch (e) {
    sphinxLogger.error([`unauthorized to delete person`, logging.Tribes])
    throw e
  }
}

export async function deleteTicketByAdmin(host, pubkey, created, owner_pubkey) {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(
      `${protocol}://${host}/ticket/${pubkey}/${created}?token=${token}`,
      {
        method: 'DELETE',
      }
    )
    if (!r.ok) {
      throw 'failed to delete ticket by admin' + r.status
    }
  } catch (e) {
    sphinxLogger.error([
      `unauthorized to delete ticket by admin`,
      logging.Tribes,
    ])
    throw e
  }
}

export async function claimOnLiquid({
  host,
  asset,
  to,
  amount,
  memo,
  owner_pubkey,
}) {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(
      protocol + '://' + host + '/withdraw?token=' + token,
      {
        method: 'POST',
        body: JSON.stringify({
          asset,
          to,
          amount,
          memo,
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    )
    if (!r.ok) {
      throw 'failed to withdraw to liquid ' + r.status
    }
    const res = await r.json()
    return res
  } catch (e) {
    sphinxLogger.error(['[liquid] unauthorized to move asset', e])
    throw e
  }
}

export async function createBadge({ icon, amount, name, owner_pubkey }) {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    const r = await fetch(
      config.boltwall_server + '/create_badge?token=' + token,
      {
        method: 'POST',
        body: JSON.stringify({
          icon,
          name,
          amount,
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!r.ok) {
      if (r.status === 402) {
        const header: string = r.headers.get('www-authenticate')!
        const lsat: Lsat = Lsat.fromHeader(header)

        const payment: SendPaymentResponse = await Lightning.sendPayment(
          lsat.invoice
        )
        let preimage: string
        if (payment.payment_preimage) {
          preimage = payment.payment_preimage.toString('hex')
          lsat.setPreimage(preimage)
          const token = await genSignedTimestamp(owner_pubkey)
          const paidRes = await fetch(
            config.boltwall_server + '/create_badge?token=' + token,
            {
              method: 'POST',
              body: JSON.stringify({
                icon,
                name,
                amount,
              }),
              headers: {
                'Content-Type': 'application/json',
                Authorization: lsat.toToken(),
              },
            }
          )
          if (!paidRes.ok) {
            throw 'failed to create badge ' + paidRes.status
          }
          const res = await paidRes.json()
          return res
        }
      } else {
        throw 'failed to create badge ' + r.status
      }
    }
    const res = await r.json()
    return res
  } catch (error) {
    sphinxLogger.error(['[liquid] Badge was not created', error])
    throw error
  }
}

export async function transferBadge({ to, asset, amount, memo, owner_pubkey }) {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    const r = await fetch(
      config.boltwall_server + '/transfer_badge?token=' + token,
      {
        method: 'POST',
        body: JSON.stringify({
          to,
          asset,
          amount,
          memo,
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    )
    if (!r.ok) {
      throw 'failed to transfer badge ' + r.status
    }
    const res = await r.json()
    return res
  } catch (error) {
    sphinxLogger.error(['[liquid] Badge was not transfered', error])
    throw error
  }
}

export async function updateBadgeInTribe({
  tribeId,
  action,
  badge,
  owner_pubkey,
  tribe_host,
}: UpdateTribeBadge) {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    console.log(`${protocol}://${tribe_host}/badges?token=${token}`)
    const r = await fetch(`${protocol}://${tribe_host}/badges?token=${token}`, {
      method: 'POST',
      body: JSON.stringify({ badge, tribeId, action }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!r.ok) {
      throw 'failed to update badge in tribe ' + r.status
    }
    const res = await r.json()
    return res
  } catch (error) {
    sphinxLogger.error('[Badge] Badge was not updated in tribe', error)
    throw error
  }
}

export function determineBadgeHost(badgeCode: number) {
  const badge_host = { 1: 'liquid.sphinx.chat' }
  return badge_host[badgeCode]
}

export async function reissueBadgeOnLiquid({
  amount,
  badge_id,
  owner_pubkey,
}: reissueOnLiquid) {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    const r = await fetch(
      `${config.boltwall_server}/v1/reissue_badge?token=${token}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          amount,
          id: badge_id,
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    )
    if (!r.ok) {
      if (r.status === 402) {
        const header: string = r.headers.get('www-authenticate')!
        const lsat: Lsat = Lsat.fromHeader(header)

        const payment: SendPaymentResponse = await Lightning.sendPayment(
          lsat.invoice
        )
        let preimage: string
        if (payment.payment_preimage) {
          preimage = payment.payment_preimage.toString('hex')
          lsat.setPreimage(preimage)
          const token = await genSignedTimestamp(owner_pubkey)
          const paidRes = await fetch(
            `${config.boltwall_server}/v1/reissue_badge?token=${token}`,
            {
              method: 'PUT',
              body: JSON.stringify({
                amount,
                id: badge_id,
              }),
              headers: {
                'Content-Type': 'application/json',
                Authorization: lsat.toToken(),
              },
            }
          )
          if (!paidRes.ok) {
            throw 'failed to reissue badge ' + paidRes.status
          }
          const res = await paidRes.json()
          return res
        }
      } else {
        throw 'failed to reissue badge ' + r.status
      }
    }
    const res = await r.json()
    return res
  } catch (error) {
    sphinxLogger.error(['[Badge] Problem reissueing badge', error])
    throw error
  }
}
