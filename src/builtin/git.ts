import * as Sphinx from 'sphinx-bot'
import { finalAction } from '../controllers/botapi'
import { Octokit } from 'octokit'
import { models, BotRecord, ChatRecord, ChatBotRecord } from '../models'
import constants from '../constants'
import { getTribeOwnersChatByUUID } from '../utils/tribes'
// import { sphinxLogger } from '../utils/logger'
import * as crypto from 'crypto'
import { getIP } from '../utils/connect'
import { all_webhook_events } from '../utils/githook'
import { sphinxLogger } from '../utils/logger'

const msg_types = Sphinx.MSG_TYPE

let initted = false

const prefix = '/git'

export const GITBOT_UUID = '_gitbot'

export const GITBOT_PIC =
  'https://stakwork-assets.s3.amazonaws.com/github-logo.png'

export interface Repo {
  path: string
}
export interface GitBotMeta {
  repos: Repo[]
}

function octokit(pat: string): Octokit {
  const octokit = new Octokit({ auth: pat })
  return octokit
}

async function getStuff(
  message: Sphinx.Message
): Promise<{ chat: ChatRecord; chatBot: ChatBotRecord; meta: GitBotMeta }> {
  try {
    const chat = await getTribeOwnersChatByUUID(message.channel.id)
    // console.log("=> WelcomeBot chat", chat);
    if (!(chat && chat.id)) throw new Error('chat not found')
    const chatBot = await models.ChatBot.findOne({
      where: {
        chatId: chat.id,
        botPrefix: '/git',
        botType: constants.bot_types.builtin,
        tenant: chat.tenant,
      },
    })
    if (!chatBot) throw new Error('chat bot not found')
    const empty = { repos: [] }
    const meta: GitBotMeta = chatBot.meta ? JSON.parse(chatBot.meta) : empty
    return { chat, chatBot, meta }
  } catch (_e) {
    throw new Error('failed')
  }
}

export function init(): void {
  if (initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    const words = (message.content && message.content.split(' ')) || []
    if (words[0] !== prefix) return
    const cmd = words[1]

    const isAdmin = message.member.roles.find((role) => role.name === 'Admin')
    if (!isAdmin) return

    switch (cmd) {
      case 'pay':
        console.log('pay user')
        return

      case 'add':
        // console.log('add')
        try {
          const { meta, chat, chatBot } = await getStuff(message)
          // if (!meta.pat) throw new Error('GitBot not connected')
          const repo = from_repo_url(words[2])
          sphinxLogger.info('==> repo: ' + repo)
          const bot = await getOrCreateGitBot(chat.tenant)
          const pat = await getPat(chat.tenant)
          await addWebhookToRepo(pat, repo, bot.secret)
          meta.repos.push({ path: repo })
          await chatBot.update({ meta: JSON.stringify(meta) })
          const embed = new Sphinx.MessageEmbed()
            .setAuthor('GitBot')
            .setDescription(repo + ' repo has been added!')
          return message.channel.send({ embed })
        } catch (e) {
          const embed = new Sphinx.MessageEmbed()
            .setAuthor('GitBot')
            .setDescription('Error: ' + e.message)
          return message.channel.send({ embed })
        }

      case 'remove':
        // console.log('remove')
        try {
          const stuff = await getStuff(message)
          // if (!meta.pat) throw new Error('GitBot not connected')
          const repo = from_repo_url(words[2])
          const repos = stuff.meta.repos.filter((r) => r.path !== repo)
          await stuff.chatBot.update({
            meta: JSON.stringify({ ...stuff.meta, repos }),
          })
          const embed = new Sphinx.MessageEmbed()
            .setAuthor('GitBot')
            .setDescription(repo + ' repo has been removed!')
          return message.channel.send({ embed })
        } catch (e) {
          const embed = new Sphinx.MessageEmbed()
            .setAuthor('GitBot')
            .setDescription('Error: ' + e.message)
          return message.channel.send({ embed })
        }

      case 'list':
        // console.log('list')
        try {
          const stuff = await getStuff(message)
          if (!stuff.meta.repos.length) throw new Error('no repos!')
          const embed3 = new Sphinx.MessageEmbed()
            .setAuthor('MotherBot')
            .setTitle('Bots:')
            .addFields(
              stuff.meta.repos.map((b) => {
                return { name: b.path, value: '' }
              })
            )
          message.channel.send({ embed: embed3 })
        } catch (e) {
          const embed = new Sphinx.MessageEmbed()
            .setAuthor('GitBot')
            .setDescription('Error: ' + e.message)
          return message.channel.send({ embed })
        }
    }
  })
}

async function getPat(tenant: number): Promise<string> {
  const existing: BotRecord = await models.Bot.findOne({
    where: { uuid: GITBOT_UUID, tenant },
  })
  if (existing) {
    return botWebhookFieldToPat(existing.webhook)
  } else throw new Error('no PAT in GitBot')
}

export function botWebhookFieldToPat(webhook: string): string {
  if (!webhook.includes('|')) throw new Error('no PAT in gitBot webhook')
  const arr = webhook.split('|')
  if (arr.length < 2) throw new Error('no PAT in gitBot webhook')
  return arr[1]
}

type GitBotType = 'github'

export function patToBotWebhookField(
  pat: string,
  gitbottype: GitBotType = 'github'
): string {
  return `${gitbottype}|${pat}`
}

async function addWebhookToRepo(
  pat: string,
  repoAndOwner: string,
  bot_secret: string
) {
  if (!bot_secret) {
    throw new Error('no GitBot secret supplied')
  }
  const octo = octokit(pat)
  const arr = repoAndOwner.split('/')
  const owner = arr[0]
  const repo = arr[1]
  const list = await octo.request('GET /repos/{owner}/{repo}/hooks', {
    owner,
    repo,
  })
  const url = (await getIP()) + '/webhook'
  if (list.data.length) {
    const existing = list.data.find((d) => d.config.url === url)
    if (existing) return
  }
  await octo.request('POST /repos/{owner}/{repo}/hooks', {
    owner,
    repo,
    active: true,
    events: all_webhook_events,
    config: {
      url: url,
      content_type: 'json',
      secret: bot_secret,
    },
  })
}

// const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
//   <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
// </svg>`

function from_repo_url(s: string) {
  const parts = s.split('/')
  if (parts.length != 2) throw new Error('invalid repo')
  return s
}

export async function updateGitBotPat(
  tenant: number,
  pat: string
): Promise<void> {
  const gitBot = await getOrCreateGitBot(tenant)
  await gitBot.update({ webhook: patToBotWebhookField(pat, 'github') })
}

export async function getOrCreateGitBot(tenant: number): Promise<BotRecord> {
  const existing = await models.Bot.findOne({
    where: { uuid: GITBOT_UUID, tenant },
  })
  if (existing) {
    return existing
  }
  const newBot = {
    id: crypto.randomBytes(10).toString('hex').toLowerCase(),
    name: 'GitBot',
    uuid: GITBOT_UUID,
    secret: crypto.randomBytes(20).toString('hex').toLowerCase(),
    pricePerUse: 0,
    tenant,
  }
  const b = await models.Bot.create(newBot)
  return b
}
