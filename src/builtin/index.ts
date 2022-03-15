// import * as SphinxBot from '../../../sphinx-bot'
import * as SphinxBot from 'sphinx-bot'
import * as MotherBot from './mother'
import * as WelcomeBot from './welcome'
import * as LoopBot from './loop'
import { Msg } from '../network/interfaces'
import { buildBotPayload } from '../controllers/bots'

async function init(): Promise<void> {
  MotherBot.init()
  WelcomeBot.init()
  LoopBot.init()
}

function builtinBotEmit(msg: Msg): void {
  setTimeout(() => {
    SphinxBot._emit('message', buildBotPayload(msg))
  }, 1200)
}

export { init, builtinBotEmit, buildBotPayload }
