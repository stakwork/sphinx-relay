import * as Sphinx from 'sphinx-bot'
// import { sphinxLogger } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import {
  ChatBotRecord,
  ChatMemberRecord,
  ChatRecord,
  ContactRecord,
  models,
} from '../models'
import constants from '../constants'
import fetch from 'node-fetch'
import { transferBadge } from '../utils/people'

interface BadgeRewards {
  badgeId: number
  rewardType: number
  amount: number
  name: string
}

const msg_types = Sphinx.MSG_TYPE

let initted = false
export function init() {
  if (initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    const isAdmin = message.member.roles.find((role) => role.name === 'Admin')
    if (isAdmin) return

    const tribe = (await models.Chat.findOne({
      where: { uuid: message.channel.id },
    })) as ChatRecord

    const bot = (await models.ChatBot.findOne({
      where: { botPrefix: '/badge' },
    })) as ChatBotRecord
    const chatMember = (await models.ChatMember.findOne({
      where: { contactId: parseInt(message.member.id!), tenant: tribe.tenant },
    })) as ChatMemberRecord

    // https://liquid.sphinx.chat/balances?pubkey=0305b986cd1a586fa89f08dd24d6c2b81d1146d8e31233ff66851aec9806af163f
    if (typeof bot.meta === 'string') {
      const rewards: BadgeRewards[] = JSON.parse(bot.meta)
      for (let i = 0; i < rewards.length; i++) {
        const reward = rewards[i]
        let doReward = false
        if (reward.rewardType === constants.reward_types.earned) {
          if (
            chatMember.totalEarned === reward.amount ||
            chatMember.totalEarned > reward.amount
          ) {
            doReward = true
          }
        } else if (reward.rewardType === constants.reward_types.spent) {
          if (
            chatMember.totalSpent === reward.amount ||
            chatMember.totalSpent > reward.amount
          ) {
            doReward = true
          }
        }
        if (doReward) {
          const hasReward = await checkReward(
            parseInt(message.member.id!),
            reward.badgeId,
            tribe.tenant
          )
          if (!hasReward.status) {
            const badge = await transferBadge({
              to: hasReward.pubkey,
              asset: reward.badgeId,
              amount: 1,
              memo: '',
              owner_pubkey: tribe.ownerPubkey,
              host: 'liquid.sphinx.chat',
            })
            if (badge.tx) {
              const resEmbed = new Sphinx.MessageEmbed()
                .setAuthor('BagdeBot')
                .setDescription(
                  `${message.member.nickname} just earned the ${reward.name} badge`
                )
              message.channel.send({ embed: resEmbed })
            }
          }
        }
      }
    }
    // check who the message came from
    // check their Member table to see if it cross the amount
    // reward the badge (by calling "/transfer" on element server)
    // create a text message that says "X badge was awarded to ALIAS for spending!"
    // auto-create BadgeBot in a tribe on any message (if it doesn't exist)
    // reward data can go in "meta" column of ChatBot
    // reward types: earned, spent, posted
    // json array like [{badgeId: 1, rewardType: 1, amount: 100000, name: Badge name}]
  })
}

async function getReward(pubkey: string) {
  const res = await fetch(
    `https://liquid.sphinx.chat/balances?pubkey=${pubkey}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  )
  const results = await res.json()
  console.log(results)
  return results
}

async function checkReward(
  contactId: number,
  rewardId: number,
  tenant: number
): Promise<{ pubkey?: string; status: boolean }> {
  const contact = (await models.Contact.findOne({
    where: { tenant, id: contactId },
  })) as ContactRecord
  const rewards = await getReward(contact.publicKey)
  for (let i = 0; i < rewards.length; i++) {
    const reward = rewards[i]
    if (reward.asset_id === rewardId) {
      return { status: true }
    }
  }
  return { pubkey: contact.publicKey, status: false }
}
