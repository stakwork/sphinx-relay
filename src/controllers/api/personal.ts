import * as meme from '../../utils/meme'
import * as FormData from 'form-data'
import fetch from 'node-fetch'
import * as people from '../../utils/people'
import { models, Contact } from '../../models'
import * as jsonUtils from '../../utils/json'
import { success, failure } from '../../utils/res'
import { loadConfig } from '../../utils/config'
import { createJWT, scopes } from '../../utils/jwt'

const config = loadConfig()
// accessed from people.sphinx.chat website
// U3BoaW54IFZlcmlmaWNhdGlvbg== : "Sphinx Verification"
export async function createPeopleProfile(req, res) {
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
export async function deletePersonProfile(req, res) {
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

export async function deleteTicketByAdmin(req, res) {
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

export async function uploadPublicPic(req, res) {
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

export async function refreshJWT(req, res) {
  if (!req.owner) return failure(res, 'no owner')
  const sc = [scopes.PERSONAL]
  const jot = createJWT(req.owner.publicKey, sc, 10080) // one week
  success(res, {
    jwt: jot,
  })
}

export async function claimOnLiquid(req, res) {
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

export async function createBadge(req, res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  try {
    const owner: Contact = (await models.Contact.findOne({
      where: { tenant, isOwner: true },
    })) as Contact

    const { name, icon, amount } = req.body
    const response = await people.createBadge({
      host: 'liquid.sphinx.chat',
      icon,
      amount,
      name,
      owner_pubkey: owner.publicKey,
    })
    return success(res, response)
  } catch (error) {
    return failure(res, error)
  }
}

export async function transferBadge(req, res) {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  try {
    const owner: Contact = (await models.Contact.findOne({
      where: { tenant, isOwner: true },
    })) as Contact
    const { amount, asset, to, memo } = req.body
    const response = await people.transferBadge({
      host: 'liquid.sphinx.chat',
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
