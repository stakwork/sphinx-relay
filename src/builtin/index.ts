// import * as SphinxBot from '../../../sphinx-bot'
import * as SphinxBot from 'sphinx-bot'
import * as MotherBot from './mother'
import * as WelcomeBot from './welcome'
import * as LoopBot from './loop'
import { Msg } from '../network/interfaces'
import { models } from '../models'
import { buildBotPayload } from '../controllers/bots'
import constants from '../constants'

async function init() {
    MotherBot.init()

    const builtInBots = await models.ChatBot.findAll({
        where: {
            botType: constants.bot_types.builtin
        }
    })
    if (!(builtInBots && builtInBots.length)) return

    builtInBots.forEach(b => {
        if (b.botPrefix === '/welcome') WelcomeBot.init()
        if (b.botPrefix === '/loopout') LoopBot.init()
    })
}

function builtinBotEmit(msg: Msg) {
    setTimeout(() => {
        SphinxBot._emit('message', buildBotPayload(msg))
    }, 1200)
}

export { init, builtinBotEmit, buildBotPayload }
