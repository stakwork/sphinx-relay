// import * as SphinxBot from '../../../sphinx-bot'
import * as SphinxBot from 'sphinx-bot'
import * as MotherBot from './mother'
import * as WelcomeBot from './welcome'
import * as LoopBot from './loop'
import { BotMsg } from '../network/interfaces'
import { buildBotPayload } from '../controllers/bots'

async function init() {
  MotherBot.init()
  WelcomeBot.init()
  LoopBot.init()
}

function builtinBotEmit(msg: BotMsg) {
  setTimeout(() => {
    SphinxBot._emit('message', buildBotPayload(msg))
  }, 1200)
}

export { init, builtinBotEmit, buildBotPayload }
