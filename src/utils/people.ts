import { loadConfig } from './config'
import { genSignedTimestamp } from './tribes'
import fetch from 'node-fetch'
import { sphinxLogger, logging } from './logger'

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
    sphinxLogger.error(`unauthorized to delete person`, logging.Tribes)
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
    sphinxLogger.error(`unauthorized to delete ticket by admin`, logging.Tribes)
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
    sphinxLogger.error('[liquid] unauthorized to move asset', e)
    throw e
  }
}

export async function createBadge({ host, icon, amount, name, owner_pubkey }) {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    // if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(protocol + '://' + host + '/issue?token=' + token, {
      method: 'POST',
      body: JSON.stringify({
        icon,
        name,
        amount,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!r.ok) {
      throw 'failed to create badge ' + r.status
    }
    const res = await r.json()
    return res
  } catch (error) {
    sphinxLogger.error('[liquid] Badge was not created', error)
    throw error
  }
}

export async function transferBadge({
  to,
  asset,
  amount,
  memo,
  owner_pubkey,
  host,
}) {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    // if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(
      protocol + '://' + host + '/transfer?token=' + token,
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
      throw 'failed to create badge ' + r.status
    }
    const res = await r.json()
    return res
  } catch (error) {
    sphinxLogger.error('[liquid] Badge was not transfered', error)
    throw error
  }
}
