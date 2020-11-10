import { loadLightning, queryRoute, channelBalance, listChannels } from '../utils/lightning'
import { success, failure } from '../utils/res'
import * as readLastLines from 'read-last-lines'
import { nodeinfo } from '../utils/nodeinfo';
import * as path from 'path'
import constants from '../constants'
import { models } from '../models'

const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../../config/app.json'))[env]

export const checkRoute = async (req, res) => {
	const { pubkey, amount } = req.query
	if (!(pubkey && pubkey.length === 66)) return failure(res, 'wrong pubkey')

	try {
		const r = await queryRoute(pubkey, parseInt(amount) || constants.min_sat_amount)
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
	const lightning = loadLightning()
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
	const lightning = loadLightning()
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

export const getBalance = async (req, res) => {

	var date = new Date()
	date.setMilliseconds(0)
	const owner = await models.Contact.findOne({ where: { isOwner: true } })
	owner.update({ lastActive: date })

	res.status(200);
	try {
		const response = await channelBalance()
		const channelList = await listChannels()
		const { channels } = channelList
		response.reserve = channels.reduce((a, chan) => a + parseInt(chan.local_chan_reserve_sat), 0)
		res.json({ success: true, response });
	} catch(e) {
		console.log("ERROR getBalance",e)
		res.json({ success: false });
	}
	res.end();
};

export const getLocalRemoteBalance = async (req, res) => {
	const lightning = loadLightning()
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