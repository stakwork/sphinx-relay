import { success, failure } from '../utils/res'
import { models } from '../models'
import * as network from '../network'
import constants from '../constants'
import * as short from 'short-uuid'

type QueryType = 'onchain_address'
export interface Query {
  type: QueryType
  uuid: string
  result?: string
}

let queries: { [k: string]: Query } = {}

const gameb = '023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f'

export async function queryOnchainAddres(req, res) {
  const uuid = short.generate()
	const owner = await models.Contact.findOne({ where: { isOwner: true } })

  const query:Query = {
    type:'onchain_address',
    uuid
  }

	const opts = {
		amt: constants.min_sat_amount,
		dest: gameb,
		data: <network.Msg>{
			type: constants.message_types.query,
			message: {
        content: JSON.stringify(query)
			},
			sender: { pub_key: owner.publicKey }
		}
	}
	try {
		await network.signAndSend(opts)
	} catch (e) {
		failure(res, e)
		return
	}

	let i = 0
	let interval = setInterval(() => {
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

export const receiveQuery = async (payload) => {
  const dat = payload.content || payload
  const sender_pub_key = dat.sender.pub_key
  const content = dat.message.content
}

export const receiveQueryResponse = async (payload) => {
  const dat = payload.content || payload
  // const sender_pub_key = dat.sender.pub_key
  const content = dat.message.content
  try {
    const q:Query = JSON.parse(content)
    queries[q.uuid] = q
  } catch(e) {
    console.log("=> ERROR receiveQueryResponse,",e)
  }
}