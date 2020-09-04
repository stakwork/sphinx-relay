// import * as Sphinx from '../../../sphinx-bot'
import * as Sphinx from 'sphinx-bot'
import * as MotherBot from './mother'

function init(){
    MotherBot.init()
}

function emit(content, chatUUID){
    Sphinx._emit('message',{content,chatUUID})
}

export {init,emit,MotherBot}
