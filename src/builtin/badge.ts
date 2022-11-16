import * as Sphinx from 'sphinx-bot'
// import { sphinxLogger } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import { ChatRecord, models } from '../models'

const msg_types = Sphinx.MSG_TYPE

let initted = false
export function init() {
  if (initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    console.log(message)
    const tribe = (await models.Chat.findOne({
      where: { uuid: message.channel.id },
    })) as ChatRecord
    console.log(tribe)
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
