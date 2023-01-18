// import * as SphinxBot from '../../../sphinx-bot'
import * as SphinxBot from 'sphinx-bot'
import * as MotherBot from './mother'
import * as WelcomeBot from './welcome'
import * as LoopBot from './loop'
import * as BadgeBot from './badge'
import * as CallRecordingBot from './callRecording'
import { BotMsg } from '../network/interfaces'
import * as GitBot from './git'
import { buildBotPayload } from '../controllers/bots'
import * as SearchBot from './search'

async function init() {
  MotherBot.init()
  WelcomeBot.init()
  LoopBot.init()
  GitBot.init()
  BadgeBot.init()
  CallRecordingBot.init()
  SearchBot.init()
}

function builtinBotEmit(msg: BotMsg) {
  setTimeout(() => {
    SphinxBot._emit('message', buildBotPayload(msg))
  }, 1200)
}

export { init, builtinBotEmit, buildBotPayload }
