// import * as Sphinx from '../../../sphinx-bot' 
import * as Sphinx from 'sphinx-bot'
import { finalAction } from '../controllers/actions'
const msg_types = Sphinx.MSG_TYPE

export function init() {

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    console.log("INCOMING MSG", message.content)
    const arr = message.content.split(' ')
    if (arr.length < 2) return
    const cmd = arr[1]
    switch (cmd) {

      case 'install':
        if (arr.length < 3) return
        console.log("INSTALL", arr[2])
        // installBot(arr[2], botInTribe)
        return true
        
      default:
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('MotherBot')
          .setTitle('Bot Commands:')
          .addFields([
            { name: 'Install a new bot', value: '/bot install {BOTNAME}' },
            { name: 'Help', value: '/bot help' }
          ])
        message.channel.send({ embed })
    }
  })
}
