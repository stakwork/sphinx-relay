import * as Sphinx from 'sphinx-bot'
import {finalAction} from '../controllers/actions'
const msg_types = Sphinx.MSG_TYPE

export function init() {
  
  const client = new Sphinx.Client()
  client.login('_', finalAction)

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
