import * as http from 'ava-http'
import { makeArgs } from '../../utils/helpers'

export async function sendBotMessage(t, node1, bot, tribe) {
  const v = {
    action: 'broadcast',
    bot_id: bot.id,
    bot_secret: bot.secret,
    chat_uuid: tribe.uuid,
    content: 'Testing external api based bot',
  }
  try {
    const r = await http.post(node1.external_ip + '/action', makeArgs(node1, v))

    t.true(r.success, 'Send bot message.')
    return r
  } catch (error) {
    return error.error
  }
}
