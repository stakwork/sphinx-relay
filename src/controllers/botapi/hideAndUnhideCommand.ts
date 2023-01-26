import * as Sphinx from 'sphinx-bot'
import { ChatBotRecord, models } from '../../models'

export async function hideCommandHandler(
  hideCommand: string,
  commands: string[],
  tribeId: number,
  message,
  botName: string,
  botPrefix: string
) {
  if (hideCommand) {
    if (commands.includes(hideCommand)) {
      const bot = (await models.ChatBot.findOne({
        where: { botPrefix: botPrefix, chatId: tribeId },
      })) as ChatBotRecord

      if (!bot.hiddenCommands) {
        await bot.update({
          hiddenCommands: JSON.stringify([hideCommand]),
        })
        const embed = new Sphinx.MessageEmbed()
          .setAuthor(botName)
          .setDescription('Command was added successfully')
        message.channel.send({ embed })
        return
      } else {
        let savedCommands = JSON.parse(bot.hiddenCommands)
        if (!savedCommands.includes(hideCommand)) {
          await bot.update({
            hiddenCommands: JSON.stringify([...savedCommands, hideCommand]),
          })
          const embed = new Sphinx.MessageEmbed()
            .setAuthor(botName)
            .setDescription('Command was added successfully')
          message.channel.send({ embed })
          return
        } else {
          const embed = new Sphinx.MessageEmbed()
            .setAuthor(botName)
            .setDescription('Command was already added')
          message.channel.send({ embed })
          return
        }
      }
    } else {
      const embed = new Sphinx.MessageEmbed()
        .setAuthor(botName)
        .setDescription('Please this command is not valid')
      message.channel.send({ embed })
      return
    }
  } else {
    const embed = new Sphinx.MessageEmbed()
      .setAuthor(botName)
      .setDescription('Please provide a valid command you would like to hide')
    message.channel.send({ embed })
    return
  }
}
