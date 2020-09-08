// import * as SphinxBot from '../../../sphinx-bot'
import * as SphinxBot from 'sphinx-bot'
import * as MotherBot from './mother'
import {Msg} from '../network/interfaces'

function init(){
    MotherBot.init()
}

function builtinBotEmit(msg:Msg){
    SphinxBot._emit('message', <SphinxBot.Message>{
        channel:{
            id: msg.chat.uuid,
            send:function(){},
        },
        reply:function(){},
        content: msg.message.content,
        type: msg.type,
    })
}

export {init,builtinBotEmit}
