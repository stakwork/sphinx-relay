import * as Sphinx from 'sphinx-bot'
import { sphinxLogger, logging } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import { CallRecordingRecord, ChatRecord, models } from '../models'
import constants from '../constants'
import fetch from 'node-fetch'

/**
 *
 ** TODO **
 * Check for when a meeting link is shared *
 * Check if call recording is authorized for this tribe
 * If call is authorized, store the call id in the table to track it, store who created the call and update the state of the call
 * write a simple function to see if the the tribe has a meme_server_address, stakwork api key and webhook
 * if it does, the function keeps hitting the meme_server to see if there is a file with the call id as file name
 * if it finds a file, send that file to stakwork and update the status to 'stored'
 * if after 3 hours no file is found the bot throws an error message (the 3 hours is just temporal for now)
 * **/

const msg_types = Sphinx.MSG_TYPE

let initted = false

export function init() {
  if (initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    try {
      const tribe = (await models.Chat.findOne({
        where: { uuid: message.channel.id },
      })) as ChatRecord
      if (message.content) {
        let jitsiServer = message.content.substring(0, tribe.jitsiServer.length)
        let callId = message.content.substring(
          tribe.jitsiServer.length,
          message.content.length
        )
        let updatedCallId = callId.split('#')[0]
        if (updatedCallId[0] === '/') {
          updatedCallId = updatedCallId.substring(1, updatedCallId.length)
        }
        if (
          tribe.callRecording === 1 &&
          tribe.jitsiServer.length !== 0 &&
          tribe.jitsiServer === jitsiServer &&
          tribe.memeServerLocation &&
          tribe.stakworkApiKey &&
          tribe.stakworkWebhook
        ) {
          const callRecord = (await models.CallRecording.create({
            recordingId: updatedCallId,
            chatId: tribe.id,
            createdBy: message.member.id!,
            status: constants.call_status.new,
          })) as CallRecordingRecord
          let timeActive = 0
          const interval = setInterval(async function () {
            timeActive += 60000
            const file = await fetch(`${tribe.memeServerLocation}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            // If recording is found
            if (file.ok) {
              console.log('File was gotten successfully')
              // Push to stakwork
              //   const sendFile = await fetch(`${tribe.memeServerLocation}`, {
              //     method: 'POST',
              //     headers: {
              //       'Content-Type': 'application/json',
              //       Authorization: `Bearer ${tribe.stakworkApiKey}`,
              //     },
              //     body: JSON.stringify({
              //       webhook: tribe.stakworkWebhook,
              //     }),
              //   })
              //   console.log(sendFile)
              //update call record to stored
              callRecord.update({ status: constants.call_status.stored })
              clearInterval(interval)
              const embed = new Sphinx.MessageEmbed()
                .setAuthor('CallRecordingBot')
                .setDescription('Call was recorded successfully')
              message.channel.send({ embed })
              return
            }
            // If recording not found after specified time then it returns an error
            if (timeActive === 180000 && !file.ok) {
              clearInterval(interval)
              const embed = new Sphinx.MessageEmbed()
                .setAuthor('CallRecordingBot')
                .setDescription('Call was not recorded on the s3 server')
              message.channel.send({ embed })
              return
            }
          }, 60000)
        } else {
          if (tribe.callRecording && !tribe.jitsiServer) {
            const embed = new Sphinx.MessageEmbed()
              .setAuthor('CallRecordingBot')
              .setDescription(
                `You can't record call because you don't have a specified jitsi server for your tribe`
              )
            message.channel.send({ embed })
            return
          }
          if (tribe.callRecording && !tribe.memeServerLocation) {
            const embed = new Sphinx.MessageEmbed()
              .setAuthor('CallRecordingBot')
              .setDescription(
                `You can't record call because you don't have a specified s3 server where call recordings would be stored`
              )
            message.channel.send({ embed })
            return
          }
          if (tribe.callRecording && !tribe.stakworkWebhook) {
            const embed = new Sphinx.MessageEmbed()
              .setAuthor('CallRecordingBot')
              .setDescription(
                `You can't record call because you don't have a specified webhook where your processed call for your tribe would be sent too`
              )
            message.channel.send({ embed })
            return
          }
          if (tribe.callRecording && !tribe.stakworkApiKey) {
            const embed = new Sphinx.MessageEmbed()
              .setAuthor('CallRecordingBot')
              .setDescription(
                `You can't record call because you don't have stakwork api key for your tribe`
              )
            message.channel.send({ embed })
            return
          }
        }
      }
    } catch (error) {
      sphinxLogger.error(`CALL RECORDING BOT ERROR ${error}`, logging.Bots)
    }
  })
}
