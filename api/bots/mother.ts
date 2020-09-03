import * as Sphinx from '../../../sphinx-bot'
import {Action, finalAction} from '../controllers/actions'
const msg_types = Sphinx.MSG_TYPE

export function init() {
  
  const client = new Sphinx.Client()
  client.login('_', embedToAction)

  client.on(msg_types.MESSAGE, async (message:Sphinx.Message) => {
    console.log("INCOMING MSG",message)

    const embed = new Sphinx.MessageEmbed()
      .setAuthor('MotherBot')
      .setTitle('Bot Commands:')
      .addFields([
        {name:'Install a new bot',value:'/bot install {BOTNAME}'},
        {name:'Help',value:'/bot help'}
      ])
      
    message.channel.send({ embed })
  })
}

function embedToAction(a){
  let text = ''
  let botName = 'Bot'
  if(a.embed && a.embed.html) {
    text = a.embed.html
    botName = a.embed.author
  } else if(typeof a==='string') {
    text = a
  }
  finalAction(<Action>{
    botName,
    text, action:'broadcast',
  })
}

// const helpHTML=`<div>
//   <b>Bot commands:</b>
//   <ul>
//     <li><b>/bot install {BOTNAME}:</b>&nbsp;Install a new bot
//     <li><b>/bot help:</b>&nbsp;Print out this help message
//   </ul>
// <div>        
// `