// import * as SphinxBot from '../../../sphinx-bot'
import * as SphinxBot from 'sphinx-bot'
import * as MotherBot from './mother'
import * as WelcomeBot from './welcome'
import * as LoopBot from './loop'
import * as BadgeBot from './badge'
import * as CallRecordingBot from './callRecording'
import * as KickBot from './kick'
import * as SentimentBot from './sentiment'
import * as JarvisBot from './jarvis'
import * as SpamGoneBot from './spamGone'
import * as MlBot from './ml'
import { BotMsg } from '../network/interfaces'
import * as GitBot from './git'
import { buildBotPayload } from '../controllers/bots'

async function init() {
  MotherBot.init()
  WelcomeBot.init()
  LoopBot.init()
  GitBot.init()
  BadgeBot.init()
  CallRecordingBot.init()
  KickBot.init()
  SentimentBot.init()
  JarvisBot.init()
  SpamGoneBot.init()
  MlBot.init()
}

function builtinBotEmit(msg: BotMsg, botPrefix?: string) {
  setTimeout(() => {
    SphinxBot._emit('message', buildBotPayload(msg, botPrefix))
  }, 1200)
}

export { init, builtinBotEmit, buildBotPayload }
