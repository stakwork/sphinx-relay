import { MessageRecord } from '../../../models'
export async function getSpecificMsg(messages: MessageRecord[], uuid: string) {
  messages.forEach((message) => {
    if (message.uuid === uuid) {
    }
  })
}
