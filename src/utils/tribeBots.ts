import { models, ChatBotRecord } from '../models'
import { getHost } from './tribes'
import fetch from 'node-fetch'
import { loadConfig } from './config'
import { genSignedTimestamp } from './tribes'
import { sphinxLogger, logging } from './logger'

const config = loadConfig()

export async function delete_bot({ uuid, owner_pubkey }) {
  const host = getHost()
  const token = await genSignedTimestamp(owner_pubkey)
  try {
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(`${protocol}://${host}/bots/${uuid}?token=${token}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    const j = await r.json()
    sphinxLogger.info(`=> bot deleted: ${j}`)
    return true
  } catch (e) {
    sphinxLogger.error(`unauthorized to delete bot ${e}`, logging.Tribes)
    throw e
  }
}

export async function declare_bot({
  uuid,
  name,
  description,
  tags,
  img,
  price_per_use,
  owner_pubkey,
  unlisted,
  deleted,
  owner_route_hint,
  owner_alias,
}) {
  const host = getHost()
  try {
    let protocol = 'https'
    if (config.tribes_insecure) protocol = 'http'
    const r = await fetch(protocol + '://' + host + '/bots', {
      method: 'POST',
      body: JSON.stringify({
        uuid,
        owner_pubkey,
        name,
        description,
        tags,
        img: img || '',
        price_per_use: price_per_use || 0,
        unlisted: unlisted || false,
        deleted: deleted || false,
        owner_route_hint: owner_route_hint || '',
        owner_alias: owner_alias || '',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const j = await r.json()
    sphinxLogger.info(`=> bot created: ${j}`)
  } catch (e) {
    sphinxLogger.error(`unauthorized to declare bot ${e}`, logging.Tribes)
    throw e
  }
}

export async function makeBotsJSON(tribeID) {
  const bots: ChatBotRecord[] = (await models.ChatBot.findAll({
    where: {
      chatId: tribeID,
    },
  })) as ChatBotRecord[]
  if (!bots) return []
  if (!bots.length) return []
  return bots.map((b) => {
    const bot = b.dataValues
    if (bot.botPrefix === '/loopout') {
      return loopoutBotJSON()
    }
    if (bot.botPrefix === '/testbot') {
      return testBotJSON()
    }
    if (bot.botPrefix === '/bet') {
      return betBotJSON()
    }
    return <BotJSON>{
      prefix: bot.botPrefix,
      price: bot.pricePerUse || 0,
      commands: null,
    }
  })
}

interface BotJSON {
  prefix: string
  price: number
  commands: BotCommand[] | null
}
interface BotCommand {
  command: string
  price: number
  min_price: number
  max_price: number
  price_index: number
  admin_only: boolean
}
function loopoutBotJSON(): BotJSON {
  return <BotJSON>{
    prefix: '/loopout',
    price: 0,
    commands: [
      {
        command: '*',
        price: 0,
        min_price: 250000,
        max_price: 16777215,
        price_index: 2,
        admin_only: false,
      },
    ],
  }
}

function testBotJSON(): BotJSON {
  return <BotJSON>{
    prefix: '/testbot',
    price: 0,
    commands: [
      {
        command: '*',
        price: 0,
        min_price: 20,
        max_price: 50,
        price_index: 1,
        admin_only: false,
      },
    ],
  }
}

function betBotJSON(): BotJSON {
  return <BotJSON>{
    prefix: '/bet',
    price: 0,
    commands: [
      {
        command: '*',
        price: 0,
        min_price: 10,
        max_price: 100000,
        price_index: 2,
        admin_only: false,
      },
    ],
  }
}
