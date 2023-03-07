import * as Lightning from '../grpc/lightning'
import * as publicIp from 'public-ip'
import * as gitinfo from './gitinfo'
import { models, MessageRecord } from '../models'
import * as interfaces from '../grpc/interfaces'
import { loadConfig } from './config'
import { sphinxLogger } from './logger'

const config = loadConfig()
const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT'

export enum NodeType {
  NODE_PUBLIC = 'node_public',
  NODE_VIRTUAL = 'node_virtual',
  NODE_GREENLIGHT = 'node_greenlight',
}

export interface NodeInfoCore {
  pubkey: string
  last_active: string
  wallet_locked: boolean
}
export interface NodeInfo extends NodeInfoCore {
  node_alias: string
  ip: string
  lnd_port: string
  relay_commit: string
  public_ip: string
  route_hint: string
  number_channels: number
  number_active_channels: number
  number_pending_channels: number
  number_peers: number
  largest_local_balance: number
  largest_remote_balance: number
  total_local_balance: number
  lnd_version: string
  relay_version: string
  payment_channel: string // ?
  hosting_provider: string // ?
  open_channel_data: interfaces.Channel[]
  pending_channel_data: { [k: string]: any }
  synced_to_chain: boolean
  synced_to_graph: boolean
  best_header_timestamp: number
  testnet: boolean
  clean: boolean
  latest_message: Date | string
  non_zero_policies: Policy[]
  node_type: NodeType
}

export async function nodeinfo(): Promise<NodeInfoCore | NodeInfo | undefined> {
  const nzp = await listNonZeroPolicies()

  let owner_pubkey

  let info: interfaces.GetInfoResponse

  try {
    const tryProxy = false
    info = await Lightning.getInfo(tryProxy)
    if (info.identity_pubkey) owner_pubkey = info.identity_pubkey
  } catch (e) {
    // no LND
    let owner
    try {
      owner = await models.Contact.findOne({ where: { id: 1 } })
    } catch (e) {
      return // just skip in SQLITE not open yet
    }
    if (!owner) return
    let lastActive = owner.lastActive
    if (!lastActive) {
      lastActive = new Date()
    }
    return {
      pubkey: owner.publicKey,
      wallet_locked: true,
      last_active: lastActive,
    }
  }

  let owner
  try {
    owner = await models.Contact.findOne({
      where: { isOwner: true, publicKey: owner_pubkey },
    })
  } catch (e) {
    return // just skip in SQLITE not open yet
  }
  if (!owner) return

  let lastActive = owner.lastActive
  if (!lastActive) {
    lastActive = new Date()
  }

  let public_ip = ''
  try {
    public_ip = await publicIp.v4()
  } catch (e) {
    //do nothing here
  }

  const clean = await isClean()

  const latest_message = await latestMessage()

  try {
    const channelList = await Lightning.listChannels({})
    if (!channelList) return
    const { channels } = channelList

    const localBalances = channels.map((c) => parseInt(c.local_balance))
    const remoteBalances = channels.map((c) => parseInt(c.remote_balance))
    const largestLocalBalance = Math.max(...localBalances)
    const largestRemoteBalance = Math.max(...remoteBalances)
    const totalLocalBalance = localBalances.reduce((a, b) => a + b, 0)

    const pendingChannels = await Lightning.pendingChannels()
    if (!info) return
    const node: NodeInfo = {
      node_alias: process.env.NODE_ALIAS || '',
      ip: process.env.NODE_IP || '',
      lnd_port: process.env.NODE_LND_PORT || '',
      relay_commit: gitinfo.commitHash,
      public_ip: public_ip,
      pubkey: owner.publicKey,
      route_hint: owner.routeHint,
      number_channels: channels.length,
      number_active_channels: info.num_active_channels,
      number_pending_channels: info.num_pending_channels,
      number_peers: info.num_peers,
      largest_local_balance: largestLocalBalance,
      largest_remote_balance: largestRemoteBalance,
      total_local_balance: totalLocalBalance,
      lnd_version: info.version,
      relay_version: gitinfo.tag,
      payment_channel: '', // ?
      hosting_provider: '', // ?
      open_channel_data: channels,
      pending_channel_data: pendingChannels,
      synced_to_chain: info.synced_to_chain,
      synced_to_graph: info.synced_to_graph,
      best_header_timestamp: info.best_header_timestamp,
      testnet: info.testnet,
      clean,
      latest_message,
      last_active: lastActive,
      wallet_locked: false,
      non_zero_policies: nzp,
      node_type: IS_GREENLIGHT
        ? NodeType.NODE_GREENLIGHT
        : NodeType.NODE_PUBLIC,
    }
    return node
  } catch (e) {
    sphinxLogger.error(`=> ${e}`)
  }
}

export async function isClean(): Promise<boolean> {
  // has owner but with no auth token (id=1?)
  const cleanOwner = await models.Contact.findOne({
    where: { id: 1, isOwner: true, authToken: null },
  })
  const msgs = await models.Message.count()
  const allContacts = await models.Contact.count()
  const noMsgs = msgs === 0
  const onlyOneContact = allContacts === 1
  if (cleanOwner && noMsgs && onlyOneContact) return true
  return false
}

async function latestMessage(): Promise<Date | string> {
  const lasts: MessageRecord[] = (await models.Message.findAll({
    limit: 1,
    order: [['createdAt', 'DESC']],
  })) as MessageRecord[]
  const last = lasts && lasts[0]
  if (last) {
    return last.createdAt
  } else {
    return ''
  }
}

interface Policy {
  chan_id: string
  node: string // "node1_policy" or "node2_policy"
  fee_base_msat: number
  disabled: boolean
}
const policies = ['node1_policy', 'node2_policy']
async function listNonZeroPolicies(): Promise<Policy[]> {
  const ret: Policy[] = []

  try {
    const channelList = await Lightning.listChannels({})
    if (!channelList) return ret
    if (!channelList.channels) return ret
    const { channels } = channelList
    await asyncForEach(channels, async (chan) => {
      const tryProxy = false
      const info = await Lightning.getChanInfo(chan.chan_id, tryProxy)
      if (!info) return
      policies.forEach((p) => {
        if (info[p]) {
          const fee_base_msat = parseInt(info[p].fee_base_msat)
          const disabled = info[p].disabled
          if (fee_base_msat > 0 || disabled) {
            ret.push({
              node: p,
              fee_base_msat,
              chan_id: chan.chan_id,
              disabled,
            })
          }
        }
      })
    })
  } catch (e) {
    return ret
  }
  return ret
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
