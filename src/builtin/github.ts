import * as Sphinx from 'sphinx-bot'
import { finalAction } from '../controllers/botapi'
import { Octokit } from 'octokit'
import { models } from '../models'
import constants from '../constants'
import { getTribeOwnersChatByUUID } from '../utils/tribes'
import { sphinxLogger } from '../utils/logger'

const msg_types = Sphinx.MSG_TYPE

let initted = false

const prefix = '/git'

interface Meta {
  pat: string
}

async function octokit(pat: string): Promise<Octokit> {
  const octokit = new Octokit({ auth: pat })
  return octokit
}

async function getStuff(
  message: Sphinx.Message
): Promise<{ chat: any; chatBot: any; meta: Meta } | undefined> {
  try {
    const chat = await getTribeOwnersChatByUUID(message.channel.id)
    // console.log("=> WelcomeBot chat", chat);
    if (!(chat && chat.id)) return
    const chatBot = await models.ChatBot.findOne({
      where: {
        chatId: chat.id,
        botPrefix: '/welcome',
        botType: constants.bot_types.builtin,
        tenant: chat.tenant,
      },
    })
    if (!chatBot) return
    const meta: Meta = JSON.parse(chatBot.meta)
    return { chat, chatBot, meta }
  } catch (_e) {
    return
  }
}

export function init() {
  if (initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    const arr = (message.content && message.content.split(' ')) || []
    if (arr[0] !== prefix) return
    const cmd = arr[1]

    const isAdmin = message.member.roles.find((role) => role.name === 'Admin')
    if (!isAdmin) return

    switch (cmd) {
      case 'pay':
        console.log('pay user')
        return

      case 'add':
        console.log('add')
        const s = await getStuff(message)
        if (!s) return sphinxLogger.error(`=> gitbot no chat`)
        if (!s.meta.pat) return sphinxLogger.error('=> GitBot not connected')
        const octo = octokit(s.meta.pat)
        console.log('octo', octo)
        return
    }
  })
}

// const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
//   <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
// </svg>`
