import { ChatBotRecord, ChatRecord } from '../../models'
import { botResponse, findBot } from './index'
import * as Sphinx from 'sphinx-bot'
import { sphinxLogger, logging } from '../../utils/logger'

interface SpamGoneMeta {
  pubkeys: string[]
}

export async function addPubkeyToSpam(
  arrMsg: string[],
  botPrefix: string,
  botName: string,
  tribe: ChatRecord,
  msgObject: Sphinx.Message
) {
  const cmd = arrMsg[1]
  try {
    if (arrMsg.length !== 3) {
      await botResponse(
        botName,
        'Invalid commad to add to Spam List',
        botPrefix,
        tribe.id,
        msgObject,
        cmd
      )
      return
    }
    const bot: ChatBotRecord = await findBot({ botPrefix, tribe })
    const pubkey = arrMsg[2]
    let exist = false
    let meta: SpamGoneMeta = JSON.parse(bot.meta || `{}`)
    if (meta.pubkeys && meta.pubkeys.length > 0) {
      for (let i = 0; i < meta.pubkeys.length; i++) {
        if (meta.pubkeys[i] === pubkey) {
          exist = true
          break
        }
      }
    }

    if (exist) {
      await botResponse(
        botName,
        'Pubkey already exist on Spam_Gone list',
        botPrefix,
        tribe.id,
        msgObject,
        cmd
      )
      return
    }
    const pubkeys =
      meta.pubkeys && meta.pubkeys.length > 0 ? [...meta.pubkeys] : []
    pubkeys.push(pubkey)
    meta.pubkeys = [...pubkeys]
    await bot.update({ meta: JSON.stringify(meta) })
    await botResponse(
      botName,
      'Pubkey added to list successfully',
      botPrefix,
      tribe.id,
      msgObject,
      cmd
    )
    return
  } catch (error) {
    sphinxLogger.error(`Error adding to spam_gone bot: ${error}`, logging.Bots)
    await botResponse(
      botName,
      error.message || 'Error occured while adding pubkey to list',
      botPrefix,
      tribe.id,
      msgObject,
      cmd
    )
    return
  }
}

export async function listAllPubkeys(
  arrMsg: string[],
  botPrefix: string,
  botName: string,
  tribe: ChatRecord,
  msgObject: Sphinx.Message
) {
  const cmd = arrMsg[1]
  try {
    if (arrMsg.length !== 2) {
      await botResponse(
        botName,
        'Invalid commad to add to Spam List',
        botPrefix,
        tribe.id,
        msgObject,
        cmd
      )
      return
    }
    const bot: ChatBotRecord = await findBot({ botPrefix, tribe })
    let meta: SpamGoneMeta = JSON.parse(bot.meta || `{}`)
    if (!meta.pubkeys || meta.pubkeys.length < 1) {
      await botResponse(
        botName,
        'No pubkey added to the Spam_Gone list yet',
        botPrefix,
        tribe.id,
        msgObject,
        cmd
      )
      return
    }
    let pubkeyMessage = '<p>Public keys on Spam_Gone:</p>'
    for (let i = 0; i < meta.pubkeys.length; i++) {
      pubkeyMessage = `${pubkeyMessage}<p>${i + 1}. ${meta.pubkeys[i]}</p>`
    }
    await botResponse(
      botName,
      pubkeyMessage,
      botPrefix,
      tribe.id,
      msgObject,
      cmd
    )
    return
  } catch (error) {
    sphinxLogger.error(`Error listing to spam_gone bot: ${error}`, logging.Bots)
    await botResponse(
      botName,
      error.message || 'Error occured while fetching spma_gone list',
      botPrefix,
      tribe.id,
      msgObject,
      cmd
    )
    return
  }
}
