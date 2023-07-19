import * as short from 'short-uuid'
import { Op } from 'sequelize'
import fetch from 'node-fetch'
import { success, failure } from '../utils/res'
import { models, AccountingRecord, Accounting } from '../models'
import * as network from '../network'
import constants from '../constants'
import * as lightning from '../grpc/lightning'
import { listUnspent, UTXO } from '../utils/wallet'
import * as jsonUtils from '../utils/json'
import * as helpers from '../helpers'
import { isProxy } from '../utils/proxy'
import { logging, sphinxLogger } from '../utils/logger'
import { Req } from '../types'

type QueryType = 'onchain_address'
export interface Query {
  type: QueryType
  uuid: string
  result?: string
  app: string
}

const queries: { [k: string]: Query } = {}

const POLL_MINS = 10

let hub_pubkey = ''

const hub_url = 'https://hub.sphinx.chat/api/v1/'
export async function get_hub_pubkey(): Promise<string> {
  try {
    const r = await fetch(hub_url + '/routingnode')
    const j = await r.json()
    if (j && j.pubkey) {
      // console.log("=> GOT HUB PUBKEY", j.pubkey)
      hub_pubkey = j.pubkey
      return j.pubkey
    }
  } catch (e) {
    sphinxLogger.warning(
      `Could not retrive hub routing node pubkey: Error: ${e}`
    )
  }
  return ''
}
get_hub_pubkey()

/*
interface Accounting {
  id: number
  pubkey: string
  onchainAddress: string
  amount: number
  confirmations: number
  sourceApp: string
  date: string
  fundingTxid: string
  onchainTxid: string
  routeHint: string
}
*/

async function getReceivedAccountings(): Promise<Accounting[]> {
  const accountings: AccountingRecord[] = (await models.Accounting.findAll({
    where: {
      status: constants.statuses.received,
    },
  })) as AccountingRecord[]
  return accountings.map((a) => a.dataValues || a)
}

async function getPendingAccountings(): Promise<Accounting[]> {
  // console.log('[WATCH] getPendingAccountings')
  const utxos: UTXO[] = await listUnspent()
  const accountings: Accounting[] = (await models.Accounting.findAll({
    where: {
      onchain_address: {
        [Op.in]: utxos.map((utxo) => utxo.address),
      },
      status: constants.statuses.pending,
    },
  })) as Accounting[]

  // console.log('[WATCH] gotPendingAccountings', accountings.length, accountings)
  const ret: Accounting[] = []
  accountings.forEach((a: Accounting) => {
    const utxo = utxos.find((u) => u.address === a.onchainAddress)
    if (utxo) {
      sphinxLogger.info(`[WATCH] UTXO ${utxo}`)
      const onchainTxid = utxo.outpoint && utxo.outpoint.txid_str
      ret.push(<Accounting>{
        id: a.id,
        pubkey: a.pubkey,
        onchainAddress: utxo.address,
        amount: parseInt(utxo.amount_sat),
        confirmations: parseInt(utxo.confirmations),
        sourceApp: a.sourceApp,
        date: a.date,
        onchainTxid: onchainTxid,
      })
    }
  })
  return ret
}

export async function listUTXOs(req: Req, res) {
  try {
    const ret: Accounting[] = await getPendingAccountings()
    success(
      res,
      ret.map((acc) => jsonUtils.accountingToJson(acc))
    )
  } catch (e) {
    failure(res, e)
  }
}

export async function getSuggestedSatPerByte(): Promise<number> {
  const MAX_AMT = 250
  try {
    const r = await fetch('https://mempool.space/api/v1/fees/recommended')
    const j = await r.json()
    return Math.min(MAX_AMT, j.halfHourFee)
  } catch (e) {
    return MAX_AMT
  }
}

// https://mempool.space/api/v1/fees/recommended
async function genChannelAndConfirmAccounting(acc: Accounting) {
  sphinxLogger.info(`[WATCH]=> genChannelAndConfirmAccounting`)
  const sat_per_byte = await getSuggestedSatPerByte()
  sphinxLogger.info(`[WATCH]=> sat_per_byte ${sat_per_byte}`)
  try {
    const r = await lightning.openChannel({
      node_pubkey: acc.pubkey,
      local_funding_amount: acc.amount,
      push_sat: 0,
      sat_per_byte,
    })
    if (!r) {
      return
    }
    sphinxLogger.info(`[WATCH]=> CHANNEL OPENED! ${r}`)
    let fundingTxid: string
    if (r.funding_txid === 'funding_txid_str') {
      fundingTxid = r.funding_txid_str
    } else {
      fundingTxid = r.funding_txid_bytes.reverse().toString('hex')
    }
    await models.Accounting.update(
      {
        status: constants.statuses.received,
        fundingTxid: fundingTxid,
        onchainTxid: acc.onchainTxid,
        amount: acc.amount,
      },
      {
        where: { id: acc.id },
      }
    )
    sphinxLogger.info(`[WATCH]=> ACCOUNTINGS UPDATED to received! ${acc.id}`)
  } catch (e) {
    sphinxLogger.error(`[ACCOUNTING] error creating channel ${e}`)
    const existing: Accounting = (await models.Accounting.findOne({
      where: { id: acc.id },
    })) as Accounting
    if (existing) {
      if (!existing.amount) {
        await existing.update({ amount: acc.amount })
      }
    }
  }
}

async function pollUTXOs() {
  if (isProxy()) return // not on proxy for now???
  // console.log("[WATCH]=> pollUTXOs")
  const accs: Accounting[] = await getPendingAccountings()
  if (!accs) return
  // console.log("[WATCH]=> accs", accs.length)
  await asyncForEach(accs, async (acc: Accounting) => {
    if (acc.confirmations <= 0) return // needs confs
    if (acc.amount <= 0) return // needs amount
    if (!acc.pubkey) return // this shouldnt happen
    await genChannelAndConfirmAccounting(acc)
  })

  await checkForConfirmedChannels()
}

async function checkForConfirmedChannels() {
  const received = await getReceivedAccountings()
  // console.log('[WATCH] received accountings:', received)
  await asyncForEach(received, async (rec: Accounting) => {
    if (rec.amount <= 0) return // needs amount
    if (!rec.pubkey) return // this shouldnt happen
    if (!rec.fundingTxid) return
    await checkChannelsAndKeysend(rec)
  })
}

async function checkChannelsAndKeysend(rec: Accounting) {
  const owner = await models.Contact.findOne({ where: { isOwner: true } })
  const chans = await lightning.listChannels({
    active_only: true,
    peer: rec.pubkey,
  })
  sphinxLogger.info(`[WATCH] chans for pubkey: ${rec.pubkey} ${chans}`)
  if (!(chans && chans.channels)) return
  chans.channels.forEach((chan) => {
    // find by txid
    if (chan.channel_point.includes(rec.fundingTxid)) {
      sphinxLogger.info(`[WATCH] found channel to keysend! ${chan}`)
      const msg: { [k: string]: any } = {
        type: constants.message_types.keysend,
      }
      const extraAmount = 2000
      const localReserve = parseInt(chan.local_chan_reserve_sat) || 0
      const remoteReserve = parseInt(chan.remote_chan_reserve_sat) || 0
      const commitFee = parseInt(chan.commit_fee) || 0
      const amount =
        rec.amount - localReserve - remoteReserve - commitFee - extraAmount
      sphinxLogger.info(`[WATCH] amt to final keysend ${amount}`)
      helpers.performKeysendMessage({
        sender: owner,
        destination_key: rec.pubkey,
        route_hint: rec.routeHint,
        amount,
        msg,
        success: function () {
          sphinxLogger.info(
            `[WATCH] complete! Updating accounting, id: ${rec.id}`
          )
          models.Accounting.update(
            {
              status: constants.statuses.confirmed,
              chanId: chan.chan_id,
              extraAmount,
              localReserve,
              remoteReserve,
              commitFee,
            },
            {
              where: { id: rec.id },
            }
          )
        },
        failure: function () {
          sphinxLogger.error(`[WATCH] failed final keysend`)
        },
      })
    }
  })
}

export function startWatchingUTXOs() {
  setInterval(pollUTXOs, POLL_MINS * 60 * 1000) // every 1 minutes
}

export async function queryOnchainAddress(req: Req, res) {
  if (!req.owner) return failure(res, 'no owner')
  // const tenant:number = req.owner.id

  sphinxLogger.info(`=> queryOnchainAddress`)
  if (!hub_pubkey) return sphinxLogger.error(`=> NO ROUTING NODE PUBKEY SET`)

  const uuid = short.generate()
  const owner = req.owner
  const app = req.params.app

  const query: Query = {
    type: 'onchain_address',
    uuid,
    app,
  }

  const opts = {
    amt: constants.min_sat_amount,
    dest: hub_pubkey,
    data: <network.Msg>{
      type: constants.message_types.query,
      message: {
        content: JSON.stringify(query),
      },
      sender: {
        pub_key: owner.publicKey,
        ...(owner.routeHint && { route_hint: owner.routeHint }),
      },
    },
  }
  try {
    await network.signAndSend(opts, owner)
  } catch (e) {
    failure(res, e)
    return
  }

  let i = 0
  const interval = setInterval(() => {
    if (i >= 15) {
      clearInterval(interval)
      delete queries[uuid]
      failure(res, 'no response received')
      return
    }
    if (queries[uuid]) {
      success(res, queries[uuid].result)
      clearInterval(interval)
      delete queries[uuid]
      return
    }
    i++
  }, 1000)
}

export const receiveQuery = async (payload: network.Payload) => {
  const dat = payload
  const sender_pub_key = dat.sender.pub_key
  const content = dat.message.content
  const owner = dat.owner
  const sender_route_hint = dat.sender.route_hint
  // const tenant:number = owner.id

  if (!sender_pub_key || !content || !owner) {
    return sphinxLogger.error(`=> wrong query format`)
  }
  let q: Query
  try {
    q = JSON.parse(content as string)
  } catch (e) {
    sphinxLogger.error(`=> ERROR receiveQuery, ${e}`)
    return
  }
  sphinxLogger.info(`=> query received ${q}`)
  let result = ''
  switch (q.type) {
    case 'onchain_address': {
      const addy = await lightning.newAddress(lightning.NESTED_PUBKEY_HASH)
      const acc = {
        date: new Date(),
        pubkey: sender_pub_key,
        onchainAddress: addy,
        amount: 0,
        sourceApp: q.app,
        status: constants.statuses.pending,
        error: '',
        routeHint: sender_route_hint,
      }
      await models.Accounting.create(acc)
      result = addy
    }
  }
  const ret: Query = {
    type: q.type,
    uuid: q.uuid,
    app: q.app,
    result,
  }
  const opts = {
    amt: constants.min_sat_amount,
    dest: sender_pub_key,
    route_hint: sender_route_hint,
    data: <network.Msg>{
      type: constants.message_types.query_response,
      message: {
        content: JSON.stringify(ret),
      },
      sender: { pub_key: owner.publicKey },
    },
  }
  try {
    await network.signAndSend(opts, owner)
  } catch (e) {
    sphinxLogger.error(`FAILED TO SEND QUERY_RESPONSE`)
    return
  }
}

export const receiveQueryResponse = async (payload: network.Payload) => {
  sphinxLogger.info(`=> receiveQueryResponse`, logging.Network)
  const dat = payload
  // const sender_pub_key = dat.sender.pub_key
  const content = dat.message.content
  try {
    const q: Query = JSON.parse(content as string)
    queries[q.uuid] = q
  } catch (e) {
    sphinxLogger.error(`=> ERROR receiveQueryResponse, ${e}`)
  }
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
