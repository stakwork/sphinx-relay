import * as Sphinx from 'sphinx-bot'
import * as MotherBot from './mother'

function init(){
    MotherBot.init()
}

function emit(txt, chatUUID){
    const arr = txt.split(' ')
    if(arr.length<2) return false
    // const cmd = arr[1]
    console.log('===> EMIT BOT MSG',{content:txt,chatUUID})
    Sphinx.EE.emit('message',{content:txt,chatUUID})
    // switch(cmd) {
    //   case 'install':
    //     if(arr.length<3) return false
    //     // installBot(arr[2], botInTribe)
    //     return true
    //   default:
    //     Sphinx.EE.emit('message',cmd,chatUUID)
    // } 
}

export {init,emit,MotherBot}
