import { ChatRecord, models } from '../../models'

interface RecurringCall {
  link: string
  title?: string
  description?: string
  tribe: ChatRecord
  tenant: number
}
export async function saveRecurringCall({
  link,
  title,
  description,
  tribe,
  tenant,
}: RecurringCall): Promise<{ status: boolean; errMsg?: string }> {
  if (
    !tribe.callRecording ||
    !tribe.jitsiServer ||
    !tribe.memeServerLocation ||
    !tribe.stakworkApiKey ||
    !tribe.stakworkWebhook ||
    tribe.jitsiServer !== validateJitsiServer(link, tribe.jitsiServer)
  ) {
    return {
      status: false,
      errMsg: 'Please configure tribe for call recording',
    }
  }
  await models.RecurringCall.create({
    link: link.split('#')[0],
    title,
    description,
    chatId: tribe.id,
    tenant,
    deleted: false,
  })
  return { status: true }
}

const validateJitsiServer = (link: string, tribeJitsi: string) => {
  return link.substring(0, tribeJitsi.length)
}
