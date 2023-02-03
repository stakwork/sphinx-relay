import * as Sphinx from 'sphinx-bot'
import { sphinxLogger, logging } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import {
  BadgeRecord,
  ChatBotRecord,
  ChatMemberRecord,
  ChatRecord,
  ContactRecord,
  MessageRecord,
  models,
  TribeBadgeRecord,
} from '../models'
import constants from '../constants'
import fetch from 'node-fetch'
import { transferBadge } from '../utils/people'
import { Badge } from '../types'
import {
  hideCommandHandler,
  determineOwnerOnly,
} from '../controllers/botapi/hideAndUnhideCommand'
import { loadConfig } from '../utils/config'

interface BadgeRewards {
  badgeId: number
  rewardType: number
  amount: number
  name: string
  asset: string
}

const msg_types = Sphinx.MSG_TYPE

let initted = false
const botPrefix = '/badge'
const config = loadConfig()

// check who the message came from
// check their Member table to see if it cross the amount
// reward the badge (by calling "/transfer" on element server)
// create a text message that says "X badge was awarded to ALIAS for spending!"
// auto-create BadgeBot in a tribe on any message (if it doesn't exist)
// reward data can go in "meta" column of ChatBot
// reward types: earned, spent, posted
// json array like [{badgeId: 1, rewardType: 1, amount: 100000, name: Badge name}]

export function init() {
  if (initted) return
  initted = true
  const commands = ['types', 'hide', 'create']
  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    if (message.author?.bot !== '/badge') return
    const arr = (message.content && message.content.split(' ')) || []
    const cmd = arr[1]
    const tribe = (await models.Chat.findOne({
      where: { uuid: message.channel.id },
    })) as ChatRecord
    if (arr[0] === botPrefix) {
      const isAdmin = message.member.roles.find((role) => role.name === 'Admin')
      if (!isAdmin) return
      switch (cmd) {
        case 'add':
          if (arr.length === 5) {
            const badgeId = Number(arr[2])
            if (isNaN(badgeId)) {
              const addFields = [
                {
                  name: 'Badge Bot Error',
                  value: 'Provide a valid badge id',
                },
              ]
              botResponse(
                addFields,
                'BadgeBot',
                'Badge Error',
                message,
                cmd,
                tribe.id
              )
              return
            }
            const rewardType = arr[3]
            if (rewardType) {
              let rewardType = Number(arr[3])
              if (isNaN(rewardType)) {
                const addFields = [
                  {
                    name: 'Badge Bot Error',
                    value: 'Provide a valid reward type',
                  },
                ]
                botResponse(
                  addFields,
                  'BadgeBot',
                  'Badge Error',
                  message,
                  cmd,
                  tribe.id
                )
                return
              }
              let validRewardType = false
              for (const key in constants.reward_types) {
                if (constants.reward_types[key] === rewardType) {
                  validRewardType = true
                }
              }
              if (!validRewardType) {
                const addFields = [
                  {
                    name: 'Badge Bot Error',
                    value: 'Provide a valid reward type',
                  },
                ]
                botResponse(
                  addFields,
                  'BadgeBot',
                  'Badge Error',
                  message,
                  cmd,
                  tribe.id
                )
                return
              }
            }
            const rewardRequirement = arr[4]
            if (rewardRequirement) {
              let rewardRequirement = Number(arr[4])
              if (isNaN(rewardRequirement) || rewardRequirement === 0) {
                const addFields = [
                  {
                    name: 'Badge Bot Error',
                    value:
                      'Provide a valid amount of sats condition a tribe memeber has to complete to earn this badge',
                  },
                ]
                botResponse(
                  addFields,
                  'BadgeBot',
                  'Badge Error',
                  message,
                  cmd,
                  tribe.id
                )
                return
              }
            }

            const badgeName = await addBadgeToTribe(
              badgeId,
              message.member.id!,
              tribe.id,
              Number(rewardRequirement),
              Number(rewardType),
              cmd,
              message
            )
            if (!badgeName) {
              return
            }
            const embed = new Sphinx.MessageEmbed()
              .setAuthor('BadgeBot')
              .setDescription(badgeName + ' badge has been added to this tribe')
              .setOnlyOwner(await determineOwnerOnly(botPrefix, cmd, tribe.id))
            message.channel.send({ embed })
            return
          } else {
            const resEmbed = new Sphinx.MessageEmbed()
              .setAuthor('BadgeBot')
              .setTitle('Badge Error:')
              .addFields([
                {
                  name: 'Create new badge using the format below',
                  value:
                    '/badge create {BADGE_NAME} {AMOUNT_OF_BADGE_TO_CREATE} {CONDITION_FOR_BADGE_TO_BE CLAIMED} {BADGE_TYPE} {BADGE_ICON}',
                },
              ])
              .setThumbnail(botSVG)
              .setOnlyOwner(await determineOwnerOnly(botPrefix, cmd, tribe.id))
            message.channel.send({ embed: resEmbed })
            return
          }
        case 'types':
          const resEmbed = new Sphinx.MessageEmbed()
            .setAuthor('BadgeBot')
            .setTitle('Badge Types:')
            .addFields([
              {
                name: 'Earn Badge',
                value: '{EARN_BADGE_TYPE} value should be {1}',
              },
              {
                name: 'Spend Badge',
                value: '{SPEND_BADGE_TYPE} value should be {2}',
              },
            ])
            .setThumbnail(botSVG)
            .setOnlyOwner(await determineOwnerOnly(botPrefix, cmd, tribe.id))
          message.channel.send({ embed: resEmbed })
          return
        case 'hide':
          await hideCommandHandler(
            arr[2],
            commands,
            tribe.id,
            message,
            'BadgeBot',
            botPrefix
          )
          return
        default:
          const embed = new Sphinx.MessageEmbed()
            .setAuthor('BadgeBot')
            .setTitle('Bot Commands:')
            .addFields([
              {
                name: 'Create new badge bot',
                value:
                  '/badge add {BADGE_ID} {BADGE_TYPE} {CONDITION_FOR_BADGE_TO_BE CLAIMED}',
              },
              { name: 'Help', value: '/badge help' },
            ])
            .setThumbnail(botSVG)
          message.channel.send({ embed })
          return
      }
    } else {
      const chatMembers: ChatMemberRecord[] = []

      try {
        const chatMember = (await models.ChatMember.findOne({
          where: {
            contactId: parseInt(message.member.id!),
            tenant: tribe.tenant,
            chatId: tribe.id,
          },
        })) as ChatMemberRecord

        chatMembers.push(chatMember)

        if (message.type === constants.message_types.boost) {
          const ogMsg = (await models.Message.findOne({
            where: { uuid: message.reply_id! },
          })) as MessageRecord
          const tribeMember = (await models.ChatMember.findOne({
            where: {
              contactId: ogMsg.sender,
              tenant: tribe.tenant,
              chatId: tribe.id,
            },
          })) as ChatMemberRecord
          chatMembers.push(tribeMember)
        }

        if (message.type === constants.message_types.direct_payment) {
          const ogMsg = (await models.Message.findOne({
            where: { uuid: message.id! },
          })) as MessageRecord
          const tribeMember = (await models.ChatMember.findOne({
            where: {
              lastAlias: ogMsg.recipientAlias,
              tenant: ogMsg.tenant,
              chatId: ogMsg.chatId,
            },
          })) as ChatMemberRecord
          chatMembers.push(tribeMember)
        }
        const tribeBadges = (await models.TribeBadge.findAll({
          where: { chatId: tribe.id },
        })) as TribeBadgeRecord[]

        if (tribeBadges && tribeBadges.length > 0) {
          for (let j = 0; j < chatMembers.length; j++) {
            const chatMember: ChatMemberRecord = chatMembers[j]
            for (let i = 0; i < tribeBadges.length; i++) {
              const tribeBadge = tribeBadges[i]
              let doReward = false
              if (tribeBadge.rewardType === constants.reward_types.earned) {
                if (
                  chatMember.totalEarned === tribeBadge.rewardRequirement ||
                  chatMember.totalEarned > tribeBadge.rewardRequirement
                ) {
                  doReward = true
                }
              } else if (
                tribeBadge.rewardType === constants.reward_types.spent
              ) {
                if (
                  chatMember.totalSpent === tribeBadge.rewardRequirement ||
                  chatMember.totalSpent > tribeBadge.rewardRequirement
                ) {
                  doReward = true
                }
              }
              if (doReward) {
                const ogBadge = (await models.Badge.findOne({
                  where: { id: tribeBadge.badgeId },
                })) as BadgeRecord
                const hasReward = await checkReward(
                  chatMember.contactId,
                  ogBadge.badgeId,
                  tribe.tenant
                )
                if (!hasReward.status) {
                  const badge = await transferBadge({
                    to: hasReward.pubkey,
                    asset: ogBadge.badgeId,
                    amount: 1,
                    memo: '',
                    owner_pubkey: tribe.ownerPubkey,
                  })
                  if (badge.tx) {
                    const resEmbed = new Sphinx.MessageEmbed()
                      .setAuthor('BagdeBot')
                      .setDescription(
                        `${chatMember.lastAlias} just earned the ${ogBadge.name} badge!, https://blockstream.info/liquid/asset/${ogBadge.asset} redeem on people.sphinx.chat`
                      )
                    message.channel.send({ embed: resEmbed })
                    return
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        sphinxLogger.error(`BADGE BOT ERROR ${error}`, logging.Bots)
      }
    }
  })
}

async function getReward(pubkey: string) {
  const res = await fetch(
    `${config.boltwall_server}/badge_balance?pubkey=${pubkey}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  )
  const results = await res.json()
  return results.balances
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

export async function createOrEditBadgeBot(
  chatId: number,
  tenant: number,
  badge: Badge,
  amount: number,
  rewardType: number
): Promise<boolean> {
  try {
    const botExist = (await models.ChatBot.findOne({
      where: { botPrefix: '/badge', chatId },
    })) as ChatBotRecord

    if (botExist) {
      let meta: string = ''
      if (typeof botExist.meta === 'string') {
        let temMeta: BadgeRewards[] = JSON.parse(botExist.meta)
        if (Array.isArray(temMeta)) {
          temMeta.push({
            name: badge.name,
            amount,
            badgeId: badge.id,
            rewardType: rewardType,
            asset: badge.asset,
          })
          meta = JSON.stringify(temMeta)
        }
      } else {
        let temMeta: BadgeRewards[] = []
        temMeta.push({
          name: badge.name,
          amount,
          badgeId: badge.id,
          rewardType: rewardType,
          asset: badge.asset,
        })
        meta = JSON.stringify(temMeta)
      }
      await botExist.update({ meta })
      return true
    } else {
      let temMeta: BadgeRewards[] = []
      temMeta.push({
        name: badge.name,
        amount,
        badgeId: badge.id,
        rewardType: rewardType,
        asset: badge.asset,
      })

      const chatBot: { [k: string]: any } = {
        chatId,
        botPrefix: '/badge',
        botType: constants.bot_types.builtin,
        msgTypes: JSON.stringify([
          constants.message_types.message,
          constants.message_types.boost,
          constants.message_types.direct_payment,
        ]),
        pricePerUse: 0,
        tenant,
        meta: JSON.stringify(temMeta),
      }
      await models.ChatBot.create(chatBot)
      return true
    }
  } catch (error) {
    sphinxLogger.error(`BADGE BOT ERROR ${error}`, logging.Bots)
    return false
  }
}

async function botResponse(addFields, author, title, message, cmd, tribeId) {
  const resEmbed = new Sphinx.MessageEmbed()
    .setAuthor(author)
    .setTitle(title)
    .addFields(addFields)
    .setThumbnail(botSVG)
    .setOnlyOwner(await determineOwnerOnly(botPrefix, cmd, tribeId))
  message.channel.send({ embed: resEmbed })
}

const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`

async function addBadgeToTribe(
  badgeId,
  tenant,
  tribeId,
  reward_requirement,
  reward_type,
  cmd,
  message
) {
  const badge = (await models.Badge.findOne({
    where: { badgeId, tenant },
  })) as BadgeRecord
  if (!badge) {
    const addFields = [
      {
        name: 'Badge Bot Error',
        value: 'Invalid Badge',
      },
    ]
    botResponse(addFields, 'BadgeBot', 'Badge Error', message, cmd, tribeId)
    return
  }
  const badgeExist = await models.TribeBadge.findOne({
    where: { chatId: tribeId, badgeId: badge.id },
  })
  if (badgeExist) {
    const addFields = [
      {
        name: 'Badge Bot Error',
        value: 'Badge already exist in tribe',
      },
    ]
    botResponse(addFields, 'BadgeBot', 'Badge Error', message, cmd, tribeId)
    return
  }
  if (
    (isNaN(reward_type) && !badge.rewardType) ||
    (isNaN(reward_requirement) && !badge.rewardRequirement)
  ) {
    const addFields = [
      {
        name: 'Badge Bot Error',
        value: 'Provide adequate badge conditions',
      },
    ]
    botResponse(addFields, 'BadgeBot', 'Badge Error', message, cmd, tribeId)
    return
  }
  await models.TribeBadge.create({
    rewardType: badge.rewardType ? badge.rewardType : reward_type,
    rewardRequirement: badge.rewardRequirement
      ? badge.rewardRequirement
      : reward_requirement,
    badgeId: badge.id,
    chatId: tribeId,
    deleted: false,
  })

  return badge.name
}
