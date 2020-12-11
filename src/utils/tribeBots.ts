import { models } from '../models'
import { getHost } from './tribes'
import fetch from 'node-fetch'

export async function declare_bot({ uuid, name, description, tags, img, price_per_use, owner_pubkey, unlisted, deleted }) {
  const host = getHost()
  try {
    const r = await fetch('https://' + host + '/bots', {
      method: 'POST',
      body: JSON.stringify({
        uuid, owner_pubkey,
        name, description, tags, img: img || '',
        price_per_use: price_per_use || 0,
        unlisted: unlisted || false,
        deleted: deleted || false,
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    const j = await r.json()
    console.log('=> bot created:', j)
  } catch (e) {
    console.log('[tribes] unauthorized to declare')
    throw e
  }
}

export async function makeBotsJSON(tribeID) {
  const bots = await models.ChatBot.findAll({
    where: {
      chatId: tribeID
    }
  })
  if (!bots) return []
  if (!bots.length) return []
  return bots.map(b => {
    const bot = b.dataValues
    if (bot.botPrefix === '/loopout') {
      return loopoutBotJSON()
    }
    if (bot.botPrefix === '/testbot') {
      return testBotJSON()
    }
    return <BotJSON>{
      prefix: bot.botPrefix,
      price: bot.pricePerUse || 0,
      commands: null,
    }
  })
}

interface BotJSON {
  prefix: string,
  price: number,
  commands: BotCommand[] | null,
}
interface BotCommand {
  command: string,
  price: number,
  min_price: number,
  max_price: number,
  price_index: number,
  admin_only: boolean,
}
function loopoutBotJSON(): BotJSON {
  return <BotJSON>{
    prefix: '/loopout',
    price: 0,
    commands: [{
      command: '*',
      price: 0,
      min_price: 250000,
      max_price: 16777215,
      price_index: 2,
      admin_only: false
    }]
  }
}

function testBotJSON(): BotJSON {
  return <BotJSON>{
    prefix: '/testbot',
    price: 0,
    commands: [{
      command: '*',
      price: 0,
      min_price: 20,
      max_price: 50,
      price_index: 1,
      admin_only: false
    }]
  }
}