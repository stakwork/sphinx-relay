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
  try {
    const bot = (await models.ChatBot.findOne({
      where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
    })) as ChatBotRecord

    if (!bot) {
      clearInterval(interval)
    }
    let meta: SentimentMeta = JSON.parse(bot.meta || `{}`)
    const url = meta.url
    console.log('+++++++++++++ SENTIMENT META', meta)
    if (url) {
      const sentiment: SentimentScore[] = await getSentiment(url)
      console.log('++++++++++++ Sendtiment', sentiment)
      const newThreshold = sentiment?.reduce(
        (total: number, value: SentimentScore) => total + value.sentiment_score,
        0
      )
      if (typeof newThreshold === 'number') {
        const last_result = meta?.last_result || 0
        const threshold = meta?.threshold || 10
        console.log('++++++++++ threshold', threshold)
        const diff = newThreshold - last_result
        console.log('++++++++++ difference', diff)

        console.log('+++++++++ last result', last_result)
        if (
          diff >= (last_result * threshold) / 100 &&
          (diff !== 0 || last_result * threshold !== 0)
        ) {
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
          meta: JSON.stringify({ ...meta, last_result: newThreshold }),
        })
      }
      console.log('++++++++++ THRESHOLD FROM ENDPOINT', newThreshold)
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
    // const res = await r.json()
    //   return res
    const res = {
      data: [
        {
          date_added_to_graph: '1678216636.390903',
          sentiment_score: 2,
        },
        {
          date_added_to_graph: '1678214894.6002529',
          sentiment_score: 2,
        },
        {
          date_added_to_graph: '1678214837.070613',
          sentiment_score: 9,
        },
        {
          date_added_to_graph: '1678142973.310696',
          sentiment_score: 9,
        },
        {
          date_added_to_graph: '1678142948.614592',
          sentiment_score: 8,
        },
        {
          date_added_to_graph: '1678142931.287526',
          sentiment_score: 7,
        },
        {
          date_added_to_graph: '1678142921.061992',
          sentiment_score: 6,
        },
        {
          date_added_to_graph: '1678142909.395699',
          sentiment_score: 5,
        },
        {
          date_added_to_graph: '1678142894.856799',
          sentiment_score: 3,
        },
        {
          date_added_to_graph: '1678142888.8225641',
          sentiment_score: 3,
        },
        {
          date_added_to_graph: '1678142877.288387',
          sentiment_score: 2,
        },
        {
          date_added_to_graph: '1678142867.893755',
          sentiment_score: 1,
        },
        {
          date_added_to_graph: '1678140944.6455538',
          sentiment_score: 3,
        },
      ],
    }
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
      'sentiment Url updated Successfully',
      botPrefix,
      tribe.id,
      message,
      command
    )
  } catch (error) {
    sphinxLogger.error([`SENTIMENT BOT ERROR ${error}`, logging.Bots])
  }
}
