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
          .setOnlyOwner(await determineOwnerOnly(botPrefix, 'hide', tribeId))
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
            .setOnlyOwner(await determineOwnerOnly(botPrefix, 'hide', tribeId))
          message.channel.send({ embed })
          return
        } else {
          const embed = new Sphinx.MessageEmbed()
            .setAuthor(botName)
            .setDescription('Command was already added')
            .setOnlyOwner(await determineOwnerOnly(botPrefix, 'hide', tribeId))
          message.channel.send({ embed })
          return
        }
      }
    } else {
      const embed = new Sphinx.MessageEmbed()
        .setAuthor(botName)
        .setDescription('Please this command is not valid')
        .setOnlyOwner(await determineOwnerOnly(botPrefix, 'hide', tribeId))
      message.channel.send({ embed })
      return
    }
  } else {
    const embed = new Sphinx.MessageEmbed()
      .setAuthor(botName)
      .setDescription('Please provide a valid command you would like to hide')
      .setOnlyOwner(await determineOwnerOnly(botPrefix, 'hide', tribeId))
    message.channel.send({ embed })
    return
  }
}

export async function determineOwnerOnly(
  botPrefix: string,
  command: string,
  tribeId
) {
  try {
    const getBot = (await models.ChatBot.findOne({
      where: { botPrefix, chatId: tribeId },
    })) as ChatBotRecord
    if (
      getBot &&
      getBot.hiddenCommands &&
      JSON.parse(getBot.hiddenCommands).includes(command)
    ) {
      return true
    }
    return false
  } catch (error) {
    return false
  }
}
