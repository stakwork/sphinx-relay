import * as FormData from 'form-data'
import fetch from 'node-fetch'
import * as meme from '../../utils/meme'
import * as people from '../../utils/people'
import {
  models,
  Contact,
  BadgeRecord,
  ChatRecord,
  TribeBadgeRecord,
} from '../../models'
import * as jsonUtils from '../../utils/json'
import { success, failure } from '../../utils/res'
import { loadConfig } from '../../utils/config'
import { createJWT, scopes } from '../../utils/jwt'
import { Badge, Req, Res } from '../../types'
// import { createOrEditBadgeBot } from '../../builtin/badge'
import constants from '../../constants'
import { createBadgeBot } from '../../utils/badgeBot'
import { genSignedTimestamp } from '../../utils/tribes'
import {
  updateBadgeInTribe,
  determineBadgeHost,
  reissueBadgeOnLiquid,
} from '../../utils/people'

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
  reward_type: number
  reward_requirement: number
  active: boolean
}
export async function createPeopleProfile(
  req: Req,
  res: Res
): Promise<void | Response> {
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
export async function deletePersonProfile(
  req: Req,
  res: Res
): Promise<void | Response> {
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

export async function deleteTicketByAdmin(
  req: Req,
  res: Res
): Promise<void | Response> {
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

export async function uploadPublicPic(
  req: Req,
  res: Res
): Promise<void | Response> {
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

export async function refreshJWT(req: Req, res: Res): Promise<void | Response> {
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

export async function createBadge(
  req: Req,
  res: Res
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id

  try {
    const owner: Contact = (await models.Contact.findOne({
      where: { tenant, isOwner: true },
    })) as Contact

    const {
      name,
      icon,
      amount,
      memo,
      reward_type,
      reward_requirement,
      chat_id,
    } = req.body
    if (
      typeof name !== 'string' ||
      typeof icon !== 'string' ||
      typeof amount !== 'number'
    )
      return failure(res, 'invalid data passed')

    if (reward_requirement && !reward_type) {
      return failure(res, 'Please provide reward type')
    }

    if (reward_type && !reward_requirement) {
      return failure(res, 'Please provide reward requirement')
    }

    if (chat_id && typeof chat_id !== 'number') {
      return failure(res, 'Please provide valid chat id')
    }

    if (reward_type) {
      let validRewardType = false
      for (const key in constants.reward_types) {
        if (constants.reward_types[key] === reward_type) {
          validRewardType = true
        }
      }
      if (!validRewardType) return failure(res, 'invalid reward type')
    }

    if (reward_requirement && typeof reward_requirement !== 'number') {
      return failure(res, 'Invalid reward requirement')
    }

    const response: Badge = await people.createBadge({
      icon,
      amount,
      name,
      owner_pubkey: owner.publicKey,
    })

    const badge = (await models.Badge.create({
      badgeId: response.id,
      name: response.name,
      amount: response.amount,
      memo,
      asset: response.asset,
      active: true,
      tenant,
      type: constants.badge_type.liquid,
      host: config.boltwall_server, //This is subject to change
      icon: response.icon,
      rewardRequirement: reward_requirement ? reward_requirement : null,
      rewardType: reward_type ? reward_type : null,
    })) as BadgeRecord

    if (chat_id && reward_requirement && reward_type) {
      const tribe = (await models.Chat.findOne({
        where: {
          id: chat_id,
          ownerPubkey: req.owner.publicKey,
          deleted: false,
          tenant,
        },
      })) as ChatRecord

      if (tribe) {
        await models.TribeBadge.create({
          rewardType: badge.rewardType,
          rewardRequirement: badge.rewardRequirement,
          badgeId: badge.id,
          chatId: tribe.id,
          active: true,
        })

        await createBadgeBot(tribe.id, tenant)
      }
    }
    return success(res, {
      badge_id: badge.badgeId,
      icon: badge.icon,
      amount_created: badge.amount,
      asset: badge.asset,
      memo: badge.memo,
      name: badge.name,
    })
  } catch (error) {
    return failure(res, error)
  }
}

export async function transferBadge(
  req: Req,
  res: Res
): Promise<void | Response> {
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

export async function getAllBadge(
  req: Req,
  res: Res
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const limit = (req.query.limit && parseInt(req.query.limit as string)) || 100
  const offset = (req.query.offset && parseInt(req.query.offset as string)) || 0

  try {
    const badges = (await models.Badge.findAll({
      where: { tenant, active: true },
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
    const finalRes: Partial<Badges>[] = []
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
          reward_requirement: badge.rewardRequirement,
          reward_type: badge.rewardType,
        })
      }
    }
    return success(res, finalRes)
  } catch (error) {
    return failure(res, error)
  }
}

export async function deleteBadge(
  req: Req,
  res: Res
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const badgeId = req.params.id

  try {
    const badge = (await models.Badge.findOne({
      where: { tenant, badgeId, active: true },
    })) as BadgeRecord
    if (!badge) {
      return failure(res, 'Badge does not exist')
    } else {
      await badge.update({ active: false })
      return success(res, `${badge.name} was deleted successfully`)
    }
  } catch (error) {
    return failure(res, error)
  }
}

export async function addBadgeToTribe(
  req: Req,
  res: Res
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { chat_id, reward_type, reward_requirement, badge_id } = req.body

  if (!chat_id || !badge_id) {
    return failure(res, 'Invalid data passed')
  }

  if (reward_requirement && !reward_type) {
    return failure(res, 'Please provide reward type')
  }

  if (reward_type && !reward_requirement) {
    return failure(res, 'Please provide reward requirement')
  }

  if (reward_type) {
    let validRewardType = false
    for (const key in constants.reward_types) {
      if (constants.reward_types[key] === reward_type) {
        validRewardType = true
      }
    }
    if (!validRewardType) return failure(res, 'invalid reward type')
  }

  if (reward_requirement && typeof reward_requirement !== 'number') {
    return failure(res, 'Invalid reward requirement')
  }
  try {
    const tribe = (await models.Chat.findOne({
      where: {
        id: chat_id,
        ownerPubkey: req.owner.publicKey,
        deleted: false,
        tenant,
      },
    })) as ChatRecord
    console.log(tribe)
    if (!tribe) {
      return failure(res, 'Invalid tribe')
    }
    const badge = (await models.Badge.findOne({
      where: { badgeId: badge_id, tenant, active: true },
    })) as BadgeRecord
    if (!badge) {
      return failure(res, 'Invalid Badge')
    }
    const badgeExist = (await models.TribeBadge.findOne({
      where: { chatId: tribe.id, badgeId: badge.id },
    })) as TribeBadgeRecord

    if (badgeExist && badgeExist.active === true) {
      return failure(res, 'Badge already exist in tribe')
    }

    if (
      (!badge.rewardType && !reward_type) ||
      (!badge.rewardRequirement && !reward_requirement)
    ) {
      return failure(res, 'Please provide reward type and reward requirement')
    }

    await updateTribeServer(badge, tribe, 'add')

    if (badgeExist && badgeExist.active === false) {
      await badgeExist.update({
        active: true,
        rewardType: badge.rewardType ? badge.rewardType : reward_type,
        rewardRequirement: badge.rewardRequirement
          ? badge.rewardRequirement
          : reward_requirement,
      })
    } else {
      await models.TribeBadge.create({
        rewardType: badge.rewardType ? badge.rewardType : reward_type,
        rewardRequirement: badge.rewardRequirement
          ? badge.rewardRequirement
          : reward_requirement,
        badgeId: badge.id,
        chatId: tribe.id,
        active: true,
      })
    }

    await createBadgeBot(tribe.id, tenant)
    return success(res, 'Badge was added to tribe successfully')
  } catch (error) {
    return failure(res, error)
  }
}

export async function updateBadge(
  req: Req,
  res: Res
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { badge_id, icon } = req.body

  if (!badge_id || !icon) {
    return failure(res, 'Missing required data')
  }

  try {
    const badge = await models.Badge.findOne({
      where: { badgeId: badge_id, tenant },
    })
    if (!badge) {
      return failure(res, "You can't update this badge")
    }
    const token = await genSignedTimestamp(req.owner.publicKey)
    const response = await fetch(
      `${config.boltwall_server}/update_badge?token=${token}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: badge_id, icon }),
      }
    )
    if (!response.ok) {
      const newRes = await response.json()
      return failure(res, newRes)
    }
    await badge.update({ icon })
    return success(res, 'Badge Icon updated successfully')
  } catch (error) {
    return failure(res, error)
  }
}

// hardcoded for now
export async function badgeTemplates(
  req: Req,
  res: Res
): Promise<void | Response> {
  const ts = [
    {
      rewardType: 1, // earned
      rewardRequirement: 1000,
      icon: 'https://community.sphinx.chat/static/1K.svg',
      name: 'Big Earner',
    },
    {
      rewardType: 2, // spent
      rewardRequirement: 1000,
      icon: 'https://community.sphinx.chat/static/VIP.svg',
      name: 'Big Spender',
    },
  ]
  return success(res, ts)
}

export async function getBadgePerTribe(
  req: Req,
  res: Res
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const limit = (req.query.limit && parseInt(req.query.limit as string)) || 100
  const offset = (req.query.offset && parseInt(req.query.offset as string)) || 0
  const chat_id = req.params.chat_id

  try {
    const tribe = (await models.Chat.findOne({
      where: {
        id: chat_id,
        ownerPubkey: req.owner.publicKey,
        deleted: false,
        tenant,
      },
    })) as ChatRecord
    if (!tribe) {
      return failure(res, 'Invalid tribe')
    }
    const badges = (await models.Badge.findAll({
      where: { tenant, active: true },
      limit,
      offset,
    })) as BadgeRecord[]

    const tribeBadges = (await models.TribeBadge.findAll({
      where: { chatId: tribe.id, active: true },
    })) as TribeBadgeRecord[]

    const badgeInTribe = {}
    for (let i = 0; i < tribeBadges.length; i++) {
      const tribeBadge = tribeBadges[i]
      badgeInTribe[tribeBadge.badgeId] = true
    }
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
          reward_requirement: badge.rewardRequirement,
          reward_type: badge.rewardType,
          active: badgeInTribe[badge.id] ? true : false,
        })
      }
    }
    return success(res, finalRes)
  } catch (error) {
    return failure(res, error)
  }
}

export async function removeBadgeFromTribe(
  req: Req,
  res: Res
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { chat_id, badge_id } = req.body

  if (
    !chat_id ||
    typeof chat_id !== 'number' ||
    !badge_id ||
    typeof badge_id !== 'number'
  ) {
    return failure(res, 'Invalid chat id or badge id')
  }

  try {
    const tribe = (await models.Chat.findOne({
      where: {
        id: chat_id,
        ownerPubkey: req.owner.publicKey,
        deleted: false,
        tenant,
      },
    })) as ChatRecord

    if (!tribe) {
      return failure(res, 'Invalid tribe')
    }

    const badge = (await models.Badge.findOne({
      where: { tenant, badgeId: badge_id },
    })) as BadgeRecord

    if (!badge) {
      return failure(res, 'Badge does not exist')
    }

    const badgeTribe = (await models.TribeBadge.findOne({
      where: { badgeId: badge.id, chatId: chat_id, active: true },
    })) as TribeBadgeRecord

    if (!badgeTribe) {
      return failure(res, 'Badge does not exist in tribe')
    }
    await updateTribeServer(badge, tribe, 'remove')

    await badgeTribe.update({ active: false })
    return success(res, 'Badge deactivated successfully')
  } catch (error) {
    return failure(res, error)
  }
}

async function updateTribeServer(
  badge: BadgeRecord,
  tribe: ChatRecord,
  action: string
) {
  const badge_host = determineBadgeHost(badge.type)
  await updateBadgeInTribe({
    tribeId: tribe.uuid,
    action,
    badge: `${badge_host}/${badge.badgeId}`,
    owner_pubkey: tribe.ownerPubkey,
    tribe_host: tribe.host,
  })
}

export async function reissueBadge(
  req: Req,
  res: Res
): Promise<void | Response> {
  if (!req.owner) return failure(res, 'no owner')
  const tenant: number = req.owner.id
  const { amount, badge_id } = req.body

  if (
    !amount ||
    !badge_id ||
    typeof amount !== 'number' ||
    typeof badge_id !== 'number'
  ) {
    return failure(res, 'Invalid amount or badge_id')
  }

  try {
    const badge = (await models.Badge.findOne({
      where: { tenant, badgeId: badge_id },
    })) as BadgeRecord

    if (!badge) {
      return failure(res, 'invalid badge')
    }

    // Reach out to liquid server
    await reissueBadgeOnLiquid({
      amount,
      badge_id,
      owner_pubkey: req.owner.publicKey,
    })

    //update affected badge row
    await badge.update({ amount: badge.amount + amount })

    return success(res, 'Badge reissued successfully')
  } catch (error) {
    console.log(error)
    return failure(res, error)
  }
}
