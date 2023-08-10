import { ChatBotRecord, ChatRecord } from '../../models'
import { botResponse } from './index'
import * as Sphinx from 'sphinx-bot'

type ContentKind = 'text' | 'image'
export interface MlMeta {
  url: string
  apiKey: string
  kind: ContentKind
}

export async function addUrl(
  bot: ChatBotRecord,
  meta: MlMeta,
  botName: string,
  botPrefix: string,
  tribe: ChatRecord,
  cmd: string,
  messageObj: Sphinx.Message,
  newUrl: string
) {
  if (!newUrl) {
    await botResponse(
      botName,
      'Please provide a valid URL',
      botPrefix,
      tribe.id,
      messageObj,
      cmd
    )
    return
  }
  meta.url = newUrl
  await bot.update({ meta: JSON.stringify(meta) })
  await botResponse(
    botName,
    'URL updated successfully',
    botPrefix,
    tribe.id,
    messageObj,
    cmd
  )
  return
}

export async function addApiKey(
  bot: ChatBotRecord,
  meta: MlMeta,
  botName: string,
  botPrefix: string,
  tribe: ChatRecord,
  cmd: string,
  messageObj: Sphinx.Message,
  newApiKey: string
) {
  if (!newApiKey) {
    await botResponse(
      botName,
      'Please provide a valid API KEY',
      botPrefix,
      tribe.id,
      messageObj,
      cmd
    )
    return
  }
  meta.apiKey = newApiKey
  await bot.update({ meta: JSON.stringify(meta) })
  await botResponse(
    botName,
    'API KEY updated successfully',
    botPrefix,
    tribe.id,
    messageObj,
    cmd
  )
  return
}
