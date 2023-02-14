import {
  CallRecordingRecord,
  ChatRecord,
  ContactRecord,
  models,
  RecurringCallRecord,
} from '../../models'
import * as helpers from '../../helpers'
import { sphinxLogger } from '../../utils/logger'
import { CronJob } from 'cron'
import fetch from 'node-fetch'
import constants from '../../constants'

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
  const recurringCall = (await models.RecurringCall.create({
    link: link.split('#')[0],
    title,
    description,
    chatId: tribe.id,
    tenant,
    deleted: false,
  })) as RecurringCallRecord
  startCallRecordingCronJob(recurringCall)
  return { status: true }
}

const validateJitsiServer = (link: string, tribeJitsi: string) => {
  return link.substring(0, tribeJitsi.length)
}

// store all current running jobs in memory
const jobs = {}

// init jobs from DB
export const initializeCronJobsForCallRecordings = async () => {
  await helpers.sleep(1000)
  const calls = await getAllCallRecording({ where: { deleted: false } })
  calls.length &&
    calls.forEach((call) => {
      sphinxLogger.info([
        '=> starting call recording cron job',
        call.id + ':',
        call.title,
      ])
      startCallRecordingCronJob(call)
    })
}

async function startCallRecordingCronJob(call: RecurringCallRecord) {
  jobs[call.id] = new CronJob(
    '0 30 * * * *',
    async function () {
      const recurringCall = (await models.RecurringCall.findOne({
        where: { id: call.id },
      })) as RecurringCallRecord
      if (!recurringCall) {
        delete jobs[call.id]
        return this.stop()
      }

      sphinxLogger.info(['EXEC CRON =>', recurringCall.id])
      const tribe = (await models.Chat.findOne({
        where: { id: recurringCall.chatId, deleted: false },
      })) as ChatRecord
      if (!tribe) {
        sphinxLogger.error(['Tribe does not exist'])
        delete jobs[call.id]
        return this.stop()
      }
      const filename = extractFileName(recurringCall.link, tribe.jitsiServer)
      const filepath = formFilenameAndPath(filename, tribe.memeServerLocation)

      const newCall = await fetch(filepath, {
        method: 'HEAD',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!newCall.ok) {
        sphinxLogger.error([
          'Invalid s3 bucket or No file found yet for',
          filename,
        ])
        return
      }
      const callVersionId = newCall.headers.raw()['x-amz-version-id'][0]
      if (recurringCall.currentVersionId === callVersionId) {
        sphinxLogger.warning(['No new file found', filename])
        return
      }
      await recurringCall.update({ currentVersionId: callVersionId })
      const stakwork = await sendToStakwork(
        tribe.stakworkApiKey,
        `${filename}_${callVersionId}`,
        `${filepath}?versionId=${callVersionId}`,
        tribe.stakworkWebhook,
        tribe.ownerPubkey,
        filename,
        tribe.name
      )
      const owner = (await models.Contact.findOne({
        where: { tenant: recurringCall.tenant, isOwner: true },
      })) as ContactRecord
      const createdBy = {
        id: owner.id,
        nickname: owner.alias,
        role: owner.isAdmin ? 'Admin' : 'Member',
      }
      const callRecording: Partial<CallRecordingRecord> = {
        recordingId: filename,
        chatId: tribe.id,
        fileName: `${filename}.mp4`,
        createdBy: JSON.stringify(createdBy),
        versionId: callVersionId,
      }
      if (!stakwork.ok) {
        callRecording.status = constants.call_status.in_actve

        //Logs
        sphinxLogger.error([
          'ERROR STORING FILE ON STARKWORK FOR RECURRING CALL WITH VERSION_ID',
          callVersionId,
        ])
      } else {
        const res = await stakwork.json()
        callRecording.status = constants.call_status.stored
        callRecording.stakworkProjectId = res.data.project_id

        //Logs
        sphinxLogger.info([
          'RECURRING CALL STORED SUCCESSFULLY ON STAKWORK WITH VERSION_ID',
          callVersionId,
        ])
      }

      await models.CallRecording.create(callRecording)
    },
    null,
    true
  )
}

async function getAllCallRecording(opts) {
  const options: { [k: string]: any } = { order: [['id', 'asc']], ...opts }
  try {
    const calls = (await models.RecurringCall.findAll(
      options
    )) as RecurringCallRecord[]
    return calls
  } catch (error) {
    sphinxLogger.error(['ERROR GETTING ALL RECURRING CALLS CRON =>', error])
    return []
  }
}

function extractFileName(link: string, jitsiServer: string) {
  let filename = link.substring(jitsiServer.length, link.length)
  if (filename[0] === '/') {
    filename = filename.substring(1, filename.length)
  }
  return filename
}

function formFilenameAndPath(filename: string, S3_BUCKET_URL: string) {
  if (S3_BUCKET_URL[S3_BUCKET_URL.length - 1] !== '/') {
    filename = `/${filename}`
  }
  return `${S3_BUCKET_URL}${filename}.mp4`
}

export async function sendToStakwork(
  apikey: string,
  callId: string,
  filePathAndName: string,
  webhook: string,
  ownerPubkey: string,
  filename: string,
  tribeName: string
) {
  const dateInUTC = new Date(Date.now()).toUTCString()
  const dateInUnix = new Date(Date.now()).getTime() / 1000

  return await fetch(`https://jobs.stakwork.com/api/v1/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token token="${apikey}"`,
    },
    body: JSON.stringify({
      name: `${callId} file`,
      workflow_id: 5579,
      workflow_params: {
        set_var: {
          attributes: {
            vars: {
              media_url: filePathAndName,
              episode_title: `Jitsi Call on ${dateInUTC}`,
              clip_description: 'My Clip Description',
              publish_date: `${dateInUnix}`,
              episode_image:
                'https://stakwork-uploads.s3.amazonaws.com/knowledge-graph-joe/jitsi.png',
              show_img_url:
                'https://stakwork-uploads.s3.amazonaws.com/knowledge-graph-joe/sphinx-logo.png',
              webhook_url: `${webhook}`,
              pubkey: ownerPubkey,
              unique_id: filename.slice(0, -4),
              clip_length: 60,
              show_title: `${tribeName}`,
            },
          },
        },
      },
    }),
  })
}
