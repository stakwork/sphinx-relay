import { MessageRecord } from '../../../models'

export function getSpecificMsg(messages: MessageRecord[], uuid: string) {
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].uuid === uuid) {
      return messages[i]
    }
  }
}
