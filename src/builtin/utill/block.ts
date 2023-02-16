import constants from '../../constants'
import { ChatRecord, ContactRecord, models, Message } from '../../models'
import * as network from '../../network'
import * as timers from '../../utils/timers'

export async function kickChatMember({
  tribe,
  contactId,
  tenant,
  owner,
}: {
  tribe: ChatRecord
  contactId: number
  tenant: number
  owner: ContactRecord
}) {
  // remove user from contactIds
  const contactIds = JSON.parse(tribe.contactIds || '[]')
  const newContactIds = contactIds.filter((cid) => cid !== contactId)
  await tribe.update({ contactIds: JSON.stringify(newContactIds) })

  // remove from ChatMembers
  await models.ChatMember.destroy({
    where: {
      chatId: tribe.id,
      contactId,
      tenant,
    },
  })

  //   Send message
  network.sendMessage({
    chat: {
      ...tribe.dataValues,
      contactIds: JSON.stringify([contactId]), // send only to the guy u kicked
    },
    sender: owner,
    message: {} as Message,
    type: constants.message_types.group_kick,
  })

  // delete all timers for this member
  timers.removeTimersByContactIdChatId(contactId, tribe.id, tenant)
}
