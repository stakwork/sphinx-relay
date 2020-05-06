import {loadLightning} from '../utils/lightning'
import { success, failure } from '../utils/res'
import * as readLastLines from 'read-last-lines'
import { nodeinfo } from '../utils/nodeinfo';
import * as path from 'path'

const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname,'../../config/app.json'))[env]

const defaultLogFiles = [
	'/home/lnd/.pm2/logs/app-error.log',
	'/var/log/syslog',
]
async function getLogsSince(req, res) {
	const logFiles = config.log_file ? [config.log_file] : defaultLogFiles
	let txt
	let err
	await asyncForEach(logFiles, async filepath=>{
		if(!txt){
			try {
				const lines = await readLastLines.read(filepath, 500)
				if(lines) {
					var linesArray = lines.split('\n')
					linesArray.reverse()
					txt = linesArray.join('\n')	
				}			
			} catch(e) {
				err = e
			}
		}
	})
	if(txt) success(res, txt)
	else failure(res, err)
}

const getInfo = async (req, res) => {
	const lightning = loadLightning()
	var request = {}
	lightning.getInfo(request, function(err, response) {
		res.status(200);
		if (err == null) {
			res.json({ success: true, response });
		} else {
			res.json({ success: false });
		}
		res.end();
	});
};

const getChannels = async (req, res) => {
  const lightning = loadLightning()
	var request = {}
	lightning.listChannels(request, function(err, response) {
		res.status(200);
		if (err == null) {
			res.json({ success: true, response });
		} else {
			res.json({ success: false });
		}
		res.end();
	});
};

const getBalance = (req, res) => {
  const lightning = loadLightning()
	var request = {}
	lightning.channelBalance(request, function(err, response) {
		res.status(200);
		if (err == null) {
			res.json({ success: true, response });
		} else {
			res.json({ success: false });
		}
		res.end();
	});
};

const getLocalRemoteBalance = async (req, res) => {
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

const getNodeInfo = async (req, res) => {
	var ipOfSource = req.connection.remoteAddress;
	if(!(ipOfSource.includes('127.0.0.1') || ipOfSource.includes('localhost'))){
		res.status(401)
		res.end()
		return
	}
	const node = await nodeinfo()
	res.status(200)
	res.json(node)
	res.end()
}

export { 
	getInfo, 
	getBalance, 
	getChannels, 
	getLocalRemoteBalance,
	getLogsSince,
	getNodeInfo,
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  	await callback(array[index], index, array);
	}
}