/* eslint-disable import/no-unresolved */
import { WebhookEvent } from '@octokit/webhooks-types'
import * as network from '../../network'
import {
  Bot,
  BotMember,
  Contact,
  BotRecord,
  ChatBotRecord,
  ChatRecord,
  ContactRecord,
  models,
} from '../../models'
import { success, failure, unauthorized } from '../../utils/res'
import constants from '../../constants'
import { getTribeOwnersChatByUUID } from '../../utils/tribes'
import { sphinxLogger, logging } from '../../utils/logger'
import * as hmac from '../../crypto/hmac'
import { GITBOT_UUID, GitBotMeta, Repo, GITBOT_PIC } from '../../builtin/git'
import { asyncForEach } from '../../helpers'
import { Req, Res } from '../../types'
import { processGithook, WebhookEventName } from '../../utils/githook'
import { CALLBACKS } from '../../builtin/ml'
import direct_message from './dm'
import pay from './pay'
import broadcast from './broadcast'

/*
hexdump -n 8 -e '4/4 "%08X" 1 "\n"' /dev/random
hexdump -n 16 -e '4/4 "%08X" 1 "\n"' /dev/random
*/

export type ActionType = 'broadcast' | 'pay' | 'keysend' | 'dm'

export interface Action {
  action: ActionType
  chat_uuid: string
  bot_id: string
  bot_name?: string
  amount?: number
  pubkey?: string
  content?: string
  msg_uuid?: string
  reply_uuid?: string
  route_hint?: string
  recipient_id?: number
  parent_id?: number
  bot_pic?: string
  only_owner?: boolean
  only_user?: number
}

export async function processWebhook(req: Req, res: Res): Promise<void> {
  sphinxLogger.info(`=> processWebhook ${req.body}`)
  const sig = req.headers['x-hub-signature-256']
  if (!sig) {
    sphinxLogger.error('invalid signature', logging.Bots)
    return unauthorized(res)
  }

  const event_type =
    req.headers['x-github-event'] || req.headers['X-GitHub-Event']
  if (!event_type) {
    sphinxLogger.error('no github event type', logging.Bots)
    return unauthorized(res)
  }

  const event = req.body as WebhookEvent
  let repo = ''
  if ('repository' in event) {
    repo = event.repository?.full_name.toLowerCase() || ''
  }
  if (!repo) {
    sphinxLogger.error('repo not configured', logging.Bots)
    return unauthorized(res)
  }

  let ok = false

  try {
    // for all "owners"
    const allChatBots: ChatBotRecord[] = (await models.ChatBot.findAll({
      where: { botUuid: GITBOT_UUID },
    })) as ChatBotRecord[]
    const allGitBots: BotRecord[] = (await models.Bot.findAll({
      where: { uuid: GITBOT_UUID },
    })) as BotRecord[]
    await asyncForEach(allChatBots, async (cb: ChatBotRecord) => {
      const meta: GitBotMeta = cb.meta ? JSON.parse(cb.meta) : { repos: [] }
      await asyncForEach(meta.repos, async (r: Repo) => {
        if (r.path.toLowerCase() === repo.toLowerCase()) {
          const gitbot = allGitBots.find((gb) => gb.tenant === cb.tenant)
          if (gitbot) {
            const valid = hmac.verifyHmac(
              sig as string,
              req.rawBody,
              gitbot.secret
            )
            if (valid) {
              ok = true
              // process!
              const chat: ChatRecord = (await models.Chat.findOne({
                where: { id: cb.chatId },
              })) as ChatRecord
              if (chat) {
                const content = processGithook(
                  req.body,
                  event_type as WebhookEventName
                )
                if (content) {
                  const a: Action = {
                    action: 'broadcast',
                    bot_id: gitbot.id,
                    chat_uuid: chat.uuid,
                    amount: 0,
                    bot_name: gitbot.name,
                    content,
                    bot_pic: GITBOT_PIC,
                  }
                  await broadcast(a)
                } else {
                  sphinxLogger.info('==> no content!!! (gitbot)')
                }
              } else {
                sphinxLogger.info('==> no chat (gitbot)')
              }
            } else {
              sphinxLogger.info('==> HMAC nOt VALID (gitbot)')
            }
          } else {
            sphinxLogger.info('==> no matching gitbot (gitbot)')
          }
        } else {
          sphinxLogger.info('==> no repo match (gitbot)')
        }
      })
    })
  } catch (e) {
    sphinxLogger.error(['failed to process webhook', e], logging.Bots)
    unauthorized(res)
  }
  if (ok) success(res, { ok: true })
  else {
    sphinxLogger.error('invalid HMAC', logging.Bots)
    unauthorized(res)
  }
}

export async function processAction(req: Req, res: Res): Promise<void> {
  sphinxLogger.info(`=> processAction ${req.body}`)
  let body = req.body
  if (body.data && typeof body.data === 'string' && body.data[1] === "'") {
    try {
      // parse out body from "data" for github webhook action
      const dataBody = JSON.parse(body.data.replace(/'/g, '"'))
      if (dataBody) body = dataBody
    } catch (e) {
      sphinxLogger.error(e)
      return failure(res, 'failed to parse webhook body json')
    }
  }
  const {
    action,
    bot_id,
    bot_secret,
    pubkey,
    amount,
    content,
    chat_uuid,
    msg_uuid,
    reply_uuid,
    recipient_id,
    parent_id,
  } = body

  if (!bot_id) return failure(res, 'no bot_id')
  const bot: Bot = (await models.Bot.findOne({ where: { id: bot_id } })) as Bot
  if (!bot) return failure(res, 'no bot')

  if (bot_secret) {
    if (!(bot.secret && bot.secret === bot_secret)) {
      return failure(res, 'wrong secret')
    }
  } else {
    const sig = req.headers['x-hub-signature-256']
    const valid = hmac.verifyHmac(sig as string, req.rawBody, bot.secret)
    if (!valid) {
      return failure(res, 'invalid HMAC')
    }
  }
  if (!action) {
    return failure(res, 'no action')
  }

  const a: Action = {
    bot_id,
    action,
    pubkey: pubkey || '',
    content: content || '',
    amount: amount || 0,
    bot_name: bot.name,
    chat_uuid: chat_uuid || '',
    msg_uuid: msg_uuid || '',
    reply_uuid: reply_uuid || '',
    parent_id: parent_id || 0,
    recipient_id: recipient_id ? parseInt(recipient_id) : 0,
  }

  try {
    const r = await finalAction(a)
    success(res, r)
  } catch (e) {
    failure(res, e)
  }
}

export async function finalAction(a: Action): Promise<void> {
  const {
    bot_id,
    action,
    pubkey,
    route_hint,
    amount,
    content,
    bot_name,
    chat_uuid,
    msg_uuid,
    reply_uuid,
    parent_id,
    recipient_id,
  } = a

  let myBot: Bot | null = null
  // not for tribe admin, for bot maker
  if (bot_id) {
    myBot = (await models.Bot.findOne({
      where: {
        id: bot_id,
      },
    })) as Bot
    if (chat_uuid) {
      const myChat = await getTribeOwnersChatByUUID(chat_uuid)
      // ACTUALLY ITS A LOCAL (FOR MY TRIBE) message! kill myBot
      if (myChat) myBot = null
    }
  }

  // console.log("=> ACTION HIT", a);
  if (myBot) {
    // IM NOT ADMIN - its my bot and i need to forward to admin - there is a chat_uuid
    const owner: Contact = (await models.Contact.findOne({
      where: { id: myBot.tenant },
    })) as Contact
    // THIS is a bot member cmd res (i am bot maker)
    const botMember: BotMember = (await models.BotMember.findOne({
      where: {
        tribeUuid: chat_uuid,
        botId: bot_id,
        tenant: owner.id,
      },
    })) as BotMember
    if (!botMember) return sphinxLogger.error(`no botMember`)

    const dest = botMember.memberPubkey
    if (!dest) return sphinxLogger.error(`no dest to send to`)
    const topic = `${dest}/${myBot.uuid}`
    const data: network.BotMsg = {
      action,
      bot_id,
      bot_name,
      type: constants.message_types.bot_res,
      message: {
        content: content || '',
        amount: amount || 0,
        uuid: msg_uuid || '',
      },
      chat: { uuid: chat_uuid || '' },
      sender: {
        pub_key: String(owner.publicKey),
        alias: bot_name || '',
        role: 0,
        route_hint,
      }, // for verify sig
    }
    if (recipient_id) {
      data.recipient_id = recipient_id
    }
    if (reply_uuid) {
      data.message.replyUuid = reply_uuid
    }
    if (parent_id) {
      data.message.parentId = parent_id
    }
    try {
      await network.signAndSend({ dest, data, route_hint }, owner, topic)
    } catch (e) {
      sphinxLogger.error(`=> couldnt mqtt publish`)
    }
    return // done
  }

  if (action === 'keysend') {
    sphinxLogger.info(`=> BOT KEYSEND to ${pubkey}`)
  } else if (action === 'pay') {
    pay(a)
  } else if (action === 'broadcast') {
    broadcast(a)
  } else if (action === 'dm') {
    direct_message(a)
  } else {
    sphinxLogger.error(`invalid action`)
  }
}

interface ChatAndOwner {
  chat: ChatRecord
  owner: ContactRecord
}
export async function validateAction(a: Action): Promise<ChatAndOwner | void> {
  if (!a.chat_uuid) return sphinxLogger.error(`no chat_uuid`)
  const theChat = await getTribeOwnersChatByUUID(a.chat_uuid)
  if (!(theChat && theChat.id)) return sphinxLogger.error(`no chat`)
  if (theChat.type !== constants.chat_types.tribe)
    return sphinxLogger.error(`not a tribe`)
  const owner: ContactRecord = (await models.Contact.findOne({
    where: { id: theChat.tenant },
  })) as ContactRecord
  return { chat: theChat, owner }
}

export async function processMlCallback(req: Req, res: Res): Promise<void> {
  const body = req.body.body
  if (!body) {
    return failure(res, 'no body')
  }
  const process_id = body.process_id
  if (!process_id) {
    return failure(res, 'no process_id')
  }
  const response = body.response
  if (!response) {
    return failure(res, 'no response')
  }

  if (CALLBACKS[process_id]) {
    CALLBACKS[process_id](response)
  }

  success(res, { ok: true })
}
