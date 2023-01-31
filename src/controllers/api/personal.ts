import * as meme from '../../utils/meme'
import * as FormData from 'form-data'
import fetch from 'node-fetch'
import * as people from '../../utils/people'
import { models, Contact, BadgeRecord } from '../../models'
import * as jsonUtils from '../../utils/json'
import { success, failure } from '../../utils/res'
import { loadConfig } from '../../utils/config'
import { createJWT, scopes } from '../../utils/jwt'
import { Badge, Req, Res } from '../../types'
// import { createOrEditBadgeBot } from '../../builtin/badge'
import constants from '../../constants'

const config = loadConfig()
// accessed from people.sphinx.chat website
// U3BoaW54IFZlcmlmaWNhdGlvbg== : "Sphinx Verification"

interface Badges {
  badge_id: number
  name: string
  amount_created: number
  amount_issued: number
  memo: string
  asset: string
  icon: string
}
export async function createPeopleProfile(req: Req, res: Res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  const priceToMeet = req.body.price_to_meet || 0

  try {
    const owner: Contact = (await models.Contact.findOne({
      where: { tenant, isOwner: true },
    })) as Contact
    const {
      id,
      host,
      owner_alias,
      description,
      img,
      tags,
      extras,
      new_ticket_time,
    } = req.body

    // if (pubkey !== owner.publicKey) {
    //   failure(res, 'mismatched pubkey')
    //   return
    // }

    const person = await people.createOrEditPerson(
      {
        host: host || config.tribes_host,
        owner_alias: owner_alias || owner.alias,
        description: description || '',
        img: img || owner.photoUrl,
        tags: tags || [],
        price_to_meet: priceToMeet,
        owner_pubkey: owner.publicKey,
        owner_route_hint: owner.routeHint,
        owner_contact_key: owner.contactKey,
        extras: extras || {},
        new_ticket_time: new_ticket_time || 0,
        uuid: owner.personUuid || '',
      },
      id || null
    )

    await owner.update({
      priceToMeet: priceToMeet || 0,
      personUuid: person.uuid,
    })
    success(res, person)
  } catch (e) {
    failure(res, e)
  }
}

// accessed from people.sphinx.chat website
export async function deletePersonProfile(req: Req, res: Res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  try {
    const owner: Contact = (await models.Contact.findOne({
      where: { tenant, isOwner: true },
    })) as Contact
    const { id, host } = req.body
    if (!id) {
      return failure(res, 'no id')
    }
    await people.deletePerson(host || config.tribes_host, id, owner.publicKey)

    await owner.update({ priceToMeet: 0 })

    success(res, jsonUtils.contactToJson(owner))
  } catch (e) {
    failure(res, e)
  }
}

export async function deleteTicketByAdmin(req: Req, res: Res) {
  if (!req.owner) return failure(res, 'no owner')

  try {
    const { host, pubkey, created } = req.body

    const person = await people.deleteTicketByAdmin(
      host || config.tribes_host,
      pubkey,
      created,
      req.owner.publicKey
    )

    success(res, person)
  } catch (e) {
    failure(res, e)
  }
}

export async function uploadPublicPic(req: Req, res: Res) {
  if (!req.owner) return failure(res, 'no owner')

  const { img_base64, img_type } = req.body
  const imgType = img_type === 'image/jpeg' ? 'image/jpg' : img_type
  try {
    const host = config.media_host

    let imageBase64 = img_base64
    if (img_base64.indexOf(',') > -1) {
      imageBase64 = img_base64.substr(img_base64.indexOf(',') + 1)
    }

    const encImgBuffer = Buffer.from(imageBase64, 'base64')

    const token = await meme.lazyToken(req.owner.publicKey, host)

    const form = new FormData()
    form.append('file', encImgBuffer, {
      contentType: imgType || 'image/jpg',
      filename: 'Profile.jpg',
      knownLength: encImgBuffer.length,
    })
    const formHeaders = form.getHeaders()
    let protocol = 'https'
    if (host.includes('localhost')) protocol = 'http'
    if (host.includes('meme.sphinx:5555')) protocol = 'http'
    const resp = await fetch(`${protocol}://${host}/public`, {
      method: 'POST',
      headers: {
        ...formHeaders, // THIS IS REQUIRED!!!
        Authorization: `Bearer ${token}`,
      },
      body: form,
    })

    const json = await resp.json()
    if (!json.muid) return failure(res, 'no muid')

    let theHost = host
    if (host === 'meme.sphinx:5555') theHost = 'localhost:5555'
    success(res, {
      img: `${protocol}://${theHost}/public/${json.muid}`,
    })
  } catch (e) {
    failure(res, e)
  }
}

export async function refreshJWT(req: Req, res: Res) {
  if (!req.owner) return failure(res, 'no owner')
  const sc = [scopes.PERSONAL]
  const jot = createJWT(req.owner.publicKey, sc, 10080) // one week
  success(res, {
    jwt: jot,
  })
}

export async function claimOnLiquid(req: Req, res: Res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  try {
    const owner: Contact = (await models.Contact.findOne({
      where: { tenant, isOwner: true },
    })) as Contact
    const { asset, to, amount, memo } = req.body

    const r = await people.claimOnLiquid({
      host: 'liquid.sphinx.chat',
      asset,
      to,
      amount,
      memo,
      owner_pubkey: owner.publicKey,
    })

    success(res, r)
  } catch (e) {
    failure(res, e)
  }
}

export async function createBadge(req: Req, res: Res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  try {
    const owner: Contact = (await models.Contact.findOne({
      where: { tenant, isOwner: true },
    })) as Contact

    const { name, icon, amount, memo } = req.body
    if (
      typeof name !== 'string' ||
      typeof icon !== 'string' ||
      typeof amount !== 'number'
    )
      return failure(res, 'invalid data passed')

    const response: Badge = await people.createBadge({
      icon,
      amount,
      name,
      owner_pubkey: owner.publicKey,
    })

    await models.Badge.create({
      badgeId: response.id,
      name: response.name,
      amount: response.amount,
      memo,
      asset: response.asset,
      deleted: false,
      tenant,
      type: constants.badge_type.liquid,
      host: config.boltwall_server, //This is subject to change
      icon: response.icon,
    })

    return success(res, 'Badge Created Successfully')
  } catch (error) {
    return failure(res, error)
  }
}

export async function transferBadge(req: Req, res: Res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  try {
    const owner: Contact = (await models.Contact.findOne({
      where: { tenant, isOwner: true },
    })) as Contact
    const { amount, asset, to, memo } = req.body
    const response = await people.transferBadge({
      amount,
      memo,
      asset,
      to,
      owner_pubkey: owner.publicKey,
    })
    return success(res, response)
  } catch (error) {
    return failure(res, error)
  }
}

export async function getAllBadge(req: Req, res: Res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const limit = (req.query.limit && parseInt(req.query.limit as string)) || 100
  const offset = (req.query.offset && parseInt(req.query.offset as string)) || 0

  try {
    const badges = (await models.Badge.findAll({
      where: { tenant, deleted: false },
      limit,
      offset,
    })) as BadgeRecord[]
    const response = await fetch(
      `${config.boltwall_server}/badge_balance?pubkey=${req.owner.publicKey}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    )
    const results = await response.json()
    const balObject = {}
    for (let i = 0; i < results.balances.length; i++) {
      const balance = results.balances[i]
      balObject[balance.asset_id] = balance
    }
    const finalRes: Badges[] = []
    for (let j = 0; j < badges.length; j++) {
      const badge = badges[j]
      if (balObject[badge.badgeId]) {
        finalRes.push({
          badge_id: badge.badgeId,
          icon: badge.icon,
          amount_created: badge.amount,
          amount_issued: badge.amount - balObject[badge.badgeId].balance,
          asset: badge.asset,
          memo: badge.memo,
          name: badge.name,
        })
      }
    }
    return success(res, finalRes)
  } catch (error) {
    return failure(res, error)
  }
}
