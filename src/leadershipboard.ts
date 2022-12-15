import { ChatMemberRecord, ChatRecord, ContactRecord, models } from './models'
import { loadConfig } from './utils/config'
import { genSignedTimestamp } from './utils/tribes'
import fetch from 'node-fetch'
import * as https from 'https'

interface LeadershipProps {
  alias: string
  spent: number
  earned: number
  reputation: number
}

const tribeAgent = new https.Agent({
  keepAlive: true,
})

const config = loadConfig()

async function updateLeadershipBoard() {
  try {
    const contacts = (await models.Contact.findAll({
      where: { isOwner: true },
    })) as ContactRecord[]

    for (let i = 0; i < contacts.length; i++) {
      const contact: ContactRecord = contacts[i]
      const tribes = (await models.Chat.findAll({
        where: { ownerPubkey: contact.publicKey },
      })) as ChatRecord[]
      for (let j = 0; j < tribes.length; j++) {
        const tribe = tribes[j]
        const tribeMembers = (await models.ChatMember.findAll({
          where: { chatId: tribe.id },
        })) as ChatMemberRecord[]
        const leadershipRecord: LeadershipProps[] =
          parseLeaderRecord(tribeMembers)
        if (leadershipRecord.length > 0) {
          const token = await genSignedTimestamp(contact.publicKey)
          let protocol = 'https'
          if (config.tribes_insecure) protocol = 'http'
          await fetch(
            `${protocol}://${tribe.host}/leaderboard/${tribe.uuid}?token=${token}`,
            {
              agent: config.tribes_insecure ? undefined : tribeAgent,
              method: 'POST',
              body: JSON.stringify(leadershipRecord),
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
}

function parseLeaderRecord(members: ChatMemberRecord[]) {
  const leaderShipRecord: LeadershipProps[] = []
  members.forEach((member) => {
    if (member.lastAlias) {
      leaderShipRecord.push({
        alias: member.lastAlias,
        spent: member.totalSpent,
        earned: member.totalEarned,
        reputation: member.reputation,
      })
    }
  })
  return leaderShipRecord
}

export function leadershipBoardInterval(ms: number) {
  setInterval(updateLeadershipBoard, ms)
}
