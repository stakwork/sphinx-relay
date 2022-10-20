import { loadConfig } from './config'
import { genSignedTimestamp } from './tribes'
import fetch from 'node-fetch'
import { sphinxLogger, logging } from './logger'
import {ContactRecord, models} from "../models";


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

export async function deleteTicketByAdmin(host, pubkey, created,owner_pubkey) {
  try {
    const token = await genSignedTimestamp(owner_pubkey)
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(`${protocol}://${host}/ticket/${pubkey}/${created}?token=${token}`, {
      method: 'DELETE'
    })
    if (!r.ok) {
      throw 'failed to delete ticket by admin' + r.status
    }
  }
  catch (e) {
    sphinxLogger.error(`unauthorized to delete ticket by admin`,logging.Tribes)
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

let person_id: number | undefined
export async function setupPersonInfo() {
  const owner: ContactRecord = (await models.Contact.findOne({
    where: { id: 1 },
  })) as ContactRecord

  let protocol = 'https'
  if (config.tribes_insecure) protocol = 'http'
  const url = protocol + '://' + config.people_host + '/person/' + owner.publicKey;
  console.log(`[+] Person url is : ${url}`)
  try {
    const arg = await fetch(
        url,
    )
    const json = await arg.json()
    const stringifyJsonResponse = JSON.stringify(json);
    console.log(`[+] Getting person details on url: ${url} with response: ${stringifyJsonResponse}`)
    person_id = json.id;
  } catch (e) {
    console.log(`[-] Error happened while getting person details for publicKey: ${owner.publicKey}`)
  }
}

export function getPersonId(): number | undefined{
  return person_id;
}
