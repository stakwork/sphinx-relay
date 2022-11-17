import * as Sphinx from 'sphinx-bot'
// import { sphinxLogger } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import { ChatBotRecord, ChatMemberRecord, ChatRecord, models } from '../models'
import constants from '../constants'

interface BadgeRewards {
  badgeId: number
  rewardType: number
  amount: number
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
        if (reward.rewardType === constants.reward_types.earned) {
          if (
            chatMember.totalEarned === reward.amount ||
            chatMember.totalEarned > reward.amount
          ) {
          }
        } else if (reward.rewardType === constants.reward_types.spent) {
          if (
            chatMember.totalSpent === reward.amount ||
            chatMember.totalSpent > reward.amount
          ) {
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
    // json array like [{badgeId: 1, rewardType: 1, amount: 100000}]
  })
}
