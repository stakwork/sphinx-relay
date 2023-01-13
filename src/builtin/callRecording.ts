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
      const arr = (message.content && message.content.split(' ')) || []
      const cmd = arr[1]
      const tribe = (await models.Chat.findOne({
        where: { uuid: message.channel.id },
      })) as ChatRecord
      if (arr[0] === '/call') {
        const isAdmin = message.member.roles.find(
          (role) => role.name === 'Admin'
        )
        if (!isAdmin) return
        switch (cmd) {
          case 'history':
            const status = Object.keys(constants.call_status)
            const calls = (await models.CallRecording.findAll({
              where: { chatId: tribe.id },
            })) as CallRecordingRecord[]
            let returnMsg = ''
            if (calls && calls.length > 0) {
              calls.forEach((call) => {
                returnMsg = `${returnMsg}${
                  JSON.parse(call.createdBy).nickname
                } created ${call.fileName} on ${call.createdAt} and it was ${
                  status[Number(call.status) - 1]
                } \n`
              })
            } else {
              returnMsg = 'There is no call recording for this tribe'
            }
            const resEmbed = new Sphinx.MessageEmbed()
              .setAuthor('CallRecordingBot')
              .setDescription(returnMsg)
            message.channel.send({ embed: resEmbed })
            return
          default:
            const embed = new Sphinx.MessageEmbed()
              .setAuthor('CallRecordingBot')
              .setTitle('Bot Commands:')
              .addFields([
                {
                  name: 'Get Call History',
                  value: '/call history',
                },
              ])
              .setThumbnail(botSVG)
            message.channel.send({ embed })
            return
        }
      } else {
        if (message.content) {
          let jitsiServer = message.content.substring(
            0,
            tribe.jitsiServer.length
          )
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
            let filename = `${updatedCallId}.mp4`
            if (
              tribe.memeServerLocation[tribe.memeServerLocation.length - 1] !==
              '/'
            ) {
              filename = `/${filename}`
            }
            const callRecord = (await models.CallRecording.create({
              recordingId: updatedCallId,
              chatId: tribe.id,
              fileName: `${updatedCallId}.mp4`,
              createdBy: JSON.stringify(message.member),
              status: constants.call_status.new,
            })) as CallRecordingRecord
            let timeActive = 0
            const interval = setInterval(async function () {
              timeActive += 60000
              const file = await fetch(
                `${tribe.memeServerLocation}${filename}`,
                {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                }
              )
              // If recording is found
              if (file.ok) {
                // Push to stakwork
                const sendFile = await fetch(
                  `https://jobs.stakwork.com/api/v1/projects`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Token token="${tribe.stakworkApiKey}"`,
                    },
                    body: JSON.stringify({
                      name: `${updatedCallId} file`,
                      workflow_id: 3235,
                      webhook_url: `${tribe.stakworkWebhook}`,
                      workflow_params: {
                        media_to_local: {
                          params: {
                            media_url: `${tribe.memeServerLocation}`,
                          },
                        },
                      },
                    }),
                  }
                )
                if (sendFile.ok) {
                  const res = await sendFile.json()
                  //update call record to stored
                  callRecord.update({
                    status: constants.call_status.stored,
                    stakworkProjectId: res.data.project_id,
                  })
                  clearInterval(interval)
                  const embed = new Sphinx.MessageEmbed()
                    .setAuthor('CallRecordingBot')
                    .setDescription('Call was recorded successfully')
                  message.channel.send({ embed })
                  return
                } else {
                  throw `Could not store in stakwork ${sendFile.status}`
                }
              }
              // If recording not found after specified time then it returns an error
              if (timeActive === 10800000 && !file.ok) {
                clearInterval(interval)
                callRecord.update({ status: constants.call_status.in_actve })
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
      }
    } catch (error) {
      sphinxLogger.error(`CALL RECORDING BOT ERROR ${error}`, logging.Bots)
    }
  })
}

const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`
