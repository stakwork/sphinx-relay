import { loadLightning, queryRoute, channelBalance, listChannels } from '../utils/lightning'
import { success, failure } from '../utils/res'
import * as readLastLines from 'read-last-lines'
import { nodeinfo } from '../utils/nodeinfo';
import constants from '../constants'
import { models } from '../models'
import { loadConfig } from '../utils/config'
import { getAppVersionsFromHub } from '../hub'

const config = loadConfig()

export async function getAppVersions(req, res) {
	const vs = await getAppVersionsFromHub()
	if (vs) {
		success(res, vs)
	} else {
		failure(res, 'Could not load app versions')
	}
}

export const checkRoute = async (req, res) => {
	if (!req.owner) return

	const { pubkey, amount, route_hint } = req.query
	if (!(pubkey && pubkey.length === 66)) return failure(res, 'wrong pubkey')

	const owner = req.owner
	try {
		const amt = parseInt(amount) || constants.min_sat_amount
		const r = await queryRoute(pubkey, amt, route_hint || '', owner.publicKey)
		success(res, r)
	} catch (e) {
		failure(res, e)
	}
};

const defaultLogFiles = [
	'/var/log/supervisor/relay.log',
	'/home/lnd/.pm2/logs/app-error.log',
	'/var/log/syslog',
]
export async function getLogsSince(req, res) {
	const logFiles = config.log_file ? [config.log_file] : defaultLogFiles
	let txt
	let err
	await asyncForEach(logFiles, async filepath => {
		if (!txt) {
			try {
				const lines = await readLastLines.read(filepath, 500)
				if (lines) {
					var linesArray = lines.split('\n')
					linesArray.reverse()
					txt = linesArray.join('\n')
				}
			} catch (e) {
				err = e
			}
		}
	})
	if (txt) success(res, txt)
	else failure(res, err)
}

export const getInfo = async (req, res) => {
	if (!req.owner) return

	const lightning = await loadLightning(true, req.owner.publicKey)
	var request = {}
	lightning.getInfo(request, function (err, response) {
		res.status(200);
		if (err == null) {
			res.json({ success: true, response });
		} else {
			res.json({ success: false });
		}
		res.end();
	});
};

export const getChannels = async (req, res) => {
	if (!req.owner) return

	const lightning = await loadLightning(true, req.owner.publicKey) // try proxy
	var request = {}
	lightning.listChannels(request, function (err, response) {
		res.status(200);
		if (err == null) {
			res.json({ success: true, response });
		} else {
			res.json({ success: false });
		}
		res.end();
	});
};

interface BalanceRes {
	pending_open_balance: number
	balance: number
	reserve: number
}
export const getBalance = async (req, res) => {
	if (!req.owner) return
	const tenant: number = req.owner.id

	var date = new Date()
	date.setMilliseconds(0)
	const owner = await models.Contact.findOne({ where: { id: tenant } })
	owner.update({ lastActive: date })

	res.status(200);
	try {
		const response = await channelBalance(owner.publicKey)
		console.log("=> balance response", response)
		const channelList = await listChannels({}, owner.publicKey)
		const { channels } = channelList
		console.log("=> balance channels", channels)
		const reserve = channels.reduce((a, chan) => a + parseInt(chan.local_chan_reserve_sat), 0)
		res.json({
			success: true, response: <BalanceRes>{
				reserve,
				full_balance: parseInt(response.balance),
				balance: parseInt(response.balance) - reserve,
				pending_open_balance: parseInt(response.pending_open_balance),
			}
		});
	} catch (e) {
		console.log("ERROR getBalance", e)
		res.json({ success: false });
	}
	res.end();
};

export const getLocalRemoteBalance = async (req, res) => {
	if (!req.owner) return
	const lightning = await loadLightning(true, req.owner.publicKey) // try proxy
	lightning.listChannels({}, (err, channelList) => {
		const { channels } = channelList

		const localBalances = channels.map(c => c.local_balance)
		const remoteBalances = channels.map(c => c.remote_balance)
		const totalLocalBalance = localBalances.reduce((a, b) => parseInt(a) + parseInt(b), 0)
		const totalRemoteBalance = remoteBalances.reduce((a, b) => parseInt(a) + parseInt(b), 0)

		res.status(200);
		if (err == null) {
			res.json({ success: true, response: { local_balance: totalLocalBalance, remote_balance: totalRemoteBalance } });
		} else {
			res.json({ success: false });
		}
		res.end();
	})
};

export const getNodeInfo = async (req, res) => {
	var ipOfSource = req.connection.remoteAddress;
	if (!(ipOfSource.includes('127.0.0.1') || ipOfSource.includes('localhost'))) {
		res.status(401)
		res.end()
		return
	}
	const node = await nodeinfo()
	res.status(200)
	res.json(node)
	res.end()
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}