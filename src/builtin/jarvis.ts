import * as Sphinx from 'sphinx-bot'
import { sphinxLogger, logging } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import { ChatRecord, models } from '../models'
const msg_types = Sphinx.MSG_TYPE
import { updateLink, sendMessageToJarvis } from './utill/jarvis'

let initted = false
const botPrefix = '/jarvis'
const botName = 'JarvisBot'

export function init() {
  if (initted) return
  initted = true
  //   const commands = ['link']
  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    if (message.author?.bot !== botPrefix) return
    try {
      const arr = (message.content && message.content.split(' ')) || []
      const cmd = arr[1]

      const tribe = (await models.Chat.findOne({
        where: { uuid: message.channel.id },
      })) as ChatRecord
      const isAdmin = message.member.roles.find((role) => role.name === 'Admin')
      if (arr[0] === botPrefix) {
        if (!isAdmin) {
          //Save message
          await sendMessageToJarvis({
            isAdmin: isAdmin ? true : false,
            message,
            tribe,
            botPrefix,
          })
          return
        }
        switch (cmd) {
          case 'link':
            //Update link
            await updateLink({
              botPrefix,
              command: cmd,
              botMessage: message,
              tribe,
              url: arr[2],
              isAdmin: isAdmin ? true : false,
              botName,
            })
            return
          default:
            //Save Message
            await sendMessageToJarvis({
              isAdmin: isAdmin ? true : false,
              message,
              tribe,
              botPrefix,
            })
            //Response to user
            const embed = new Sphinx.MessageEmbed()
              .setAuthor('JarvisBot')
              .setTitle('Bot Commands:')
              .addFields([
                {
                  name: 'Add Jarvis Api',
                  value: '/jarvis link {JARVIS_API}',
                },
                { name: 'Help', value: '/jarvis help' },
              ])
              .setThumbnail(botSVG)
            message.channel.send({ embed })
            return
        }
      } else {
        await sendMessageToJarvis({
          isAdmin: isAdmin ? true : false,
          message,
          tribe,
          botPrefix,
        })
        return
      }
    } catch (error) {
      sphinxLogger.error(`JARVIS BOT ERROR ${error}`, logging.Bots)
    }
  })
}

const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`
