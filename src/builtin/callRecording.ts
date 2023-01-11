import * as Sphinx from 'sphinx-bot'
import { sphinxLogger, logging } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import { ChatRecord, models } from '../models'

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
          tribe.jitsiServer === jitsiServer
        ) {
          console.log(jitsiServer)
          console.log(updatedCallId)
        }
      }
    } catch (error) {
      sphinxLogger.error(`CALL RECORDING BOT ERROR ${error}`, logging.Bots)
    }
  })
}
