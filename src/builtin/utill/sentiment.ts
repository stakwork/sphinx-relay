import * as Sphinx from 'sphinx-bot'
import { determineOwnerOnly } from '../../controllers/botapi/hideAndUnhideCommand'
import { ChatBotRecord, ChatRecord, models } from '../../models'
import { sphinxLogger, logging } from '../../utils/logger'
import fetch from 'node-fetch'

interface SentimentMeta {
  threshold: number
  last_result: number
  timer: number
  url: string
}

interface SentimentScore {
  date_added_to_graph: string
  sentiment_score: number
}

export async function botResponse(
  botName: string,
  message: string,
  botPrefix: string,
  tribeId: number,
  botMessage: Sphinx.Message,
  command: string
) {
  const embed = new Sphinx.MessageEmbed()
    .setAuthor(botName)
    .setDescription(message)
    .setOnlyOwner(await determineOwnerOnly(botPrefix, command, tribeId))
  botMessage.channel.send({ embed })
}

export async function threshold(
  botName: string,
  command: string,
  tribe: ChatRecord,
  botPrefix: string,
  message: Sphinx.Message,
  value: string
) {
  const threshold = Number(value)
  if (isNaN(threshold)) {
    return await botResponse(
      botName,
      'Invalid threshold value',
      botPrefix,
      tribe.id,
      message,
      command
    )
  }
  try {
    const bot = (await models.ChatBot.findOne({
      where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
    })) as ChatRecord

    if (!bot) {
      sphinxLogger.error([`SENTIMENT BOT ERROR, BOT NOT FOUND`, logging.Bots])
    }

    let meta: SentimentMeta = JSON.parse(bot.meta || `{}`)
    meta.threshold = threshold
    await bot.update({ meta: JSON.stringify(meta) })
    return await botResponse(
      botName,
      'Threshold updated successfully',
      botPrefix,
      tribe.id,
      message,
      command
    )
  } catch (error) {
    sphinxLogger.error([`SENTIMENT BOT ERROR ${error}`, logging.Bots])
    return await botResponse(
      botName,
      'Error updating threshold',
      botPrefix,
      tribe.id,
      message,
      command
    )
  }
}

export async function timer(
  botName: string,
  command: string,
  tribe: ChatRecord,
  botPrefix: string,
  message: Sphinx.Message,
  value: string,
  interval: any
) {
  const timer = Number(value)
  if (isNaN(timer)) {
    await botResponse(
      botName,
      'Invalid timer value',
      botPrefix,
      tribe.id,
      message,
      command
    )
  }
  try {
    const bot = (await models.ChatBot.findOne({
      where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
    })) as ChatRecord

    let meta: SentimentMeta = JSON.parse(bot.meta || `{}`)
    meta.timer = timer
    await bot.update({ meta: JSON.stringify(meta) })
    clearInterval(interval)
    interval = setInterval(() => {
      checkThreshold(tribe, botName, botPrefix, interval, command, message)
    }, timerMs(timer))

    botResponse(
      botName,
      'Timer was updated successfully',
      botPrefix,
      tribe.id,
      message,
      command
    )
  } catch (error) {
    sphinxLogger.error([`SENTIMENT BOT ERROR ${error}`, logging.Bots])
  }
}

export function timerMs(mins: number) {
  return mins * 60 * 1000
}

export async function checkThreshold(
  tribe: ChatRecord,
  botName: string,
  botPrefix: string,
  interval: any,
  command: string,
  message: Sphinx.Message
) {
  sphinxLogger.info(`SENTIMENT BOT GOING TO GET SENTIMENT`, logging.Bots)
  try {
    const bot = (await models.ChatBot.findOne({
      where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
    })) as ChatBotRecord

    if (!bot) {
      clearInterval(interval)
    }
    let meta: SentimentMeta = JSON.parse(bot.meta || `{}`)
    const url = meta.url

    if (url) {
      const sentiment: SentimentScore[] = await getSentiment(url)

      const newResult =
        sentiment?.reduce(
          (total: number, value: SentimentScore) =>
            total + value.sentiment_score,
          0
        ) / sentiment?.length

      if (typeof newResult === 'number') {
        const last_result = meta?.last_result || 0
        const threshold = meta?.threshold || 10
        const maximum_result = 100
        const diff = (Math.abs(newResult - last_result) / maximum_result) * 100
        console.log('++++++++++++ Difference', diff)
        if (diff >= threshold) {
          // Send Alert to tribe
          botResponse(
            botName,
            'Sentiment has increased by some percentage',
            botPrefix,
            tribe.id,
            message,
            command || 'threshold'
          )
        }
        await bot.update({
          meta: JSON.stringify({ ...meta, last_result: newResult }),
        })
      }
    }
  } catch (error) {
    sphinxLogger.error([`SENTIMENT BOT ERROR ${error}`, logging.Bots])
  }
}

async function getSentiment(url) {
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!r.ok) {
      throw 'failed to get sentiment ' + r.status
    }
    const res = await r.json()
    return res?.data || []
  } catch (error) {
    throw error
  }
}

export async function updateUrl(
  botPrefix: string,
  botName: string,
  url: string,
  tribe: ChatRecord,
  command: string,
  message: Sphinx.Message
) {
  if (!url) {
    return await botResponse(
      botName,
      'Please provide Valid URL',
      botPrefix,
      tribe.id,
      message,
      command
    )
  }
  try {
    const bot = (await models.ChatBot.findOne({
      where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
    })) as ChatBotRecord

    if (!bot) {
      sphinxLogger.error([`SENTIMENT BOT ERROR, BOT NOT FOUND`, logging.Bots])
    }

    let meta: SentimentMeta = JSON.parse(bot.meta || `{}`)
    meta.url = url
    await bot.update({ meta: JSON.stringify(meta) })
    return await botResponse(
      botName,
      'Sentiment Url updated Successfully',
      botPrefix,
      tribe.id,
      message,
      command
    )
  } catch (error) {
    sphinxLogger.error([`SENTIMENT BOT ERROR ${error}`, logging.Bots])
  }
}
