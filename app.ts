import * as express from 'express'
import * as helmet from 'helmet'
import * as cookieParser from 'cookie-parser'
import * as cors from 'cors'
import logger, {logging} from './src/utils/logger'
import { pingHubInterval, checkInvitesHubInterval } from './src/hub'
import { genUsersInterval } from './src/utils/proxy'
import { setupDatabase, setupDone, setupOwnerContact } from './src/utils/setup'
import * as controllers from './src/controllers'
import * as connect from './src/utils/connect'
import * as socket from './src/utils/socket'
import * as network from './src/network'
import { ownerMiddleware, unlocker } from './src/auth'
import * as grpc from './src/grpc/subscribe'
import * as cert from './src/utils/cert'
import {loadConfig} from './src/utils/config'
import * as lightning from './src/grpc/lightning'
import * as ByteBuffer from 'bytebuffer'

const env = process.env.NODE_ENV || 'development';
const config = loadConfig()
const port = process.env.PORT || config.node_http_port || 3001

console.log("=> env:", env)
// console.log('=> config: ',config)

process.env.GRPC_SSL_CIPHER_SUITES = 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384';
process.env.NODE_EXTRA_CA_CERTS = config.tls_location;

// START SETUP!
async function start() {
	await setupDatabase()
	mainSetup()
	// // IF NOT UNLOCK, go ahead and start this now
	if (config.hub_api_url && !config.unlock) {
		pingHubInterval(15000)
		genUsersInterval(15000)
	}
}
start()

async function mainSetup() {
	const s = lightning.loadScheduler()
	s.schedule({
		node_id: ByteBuffer.fromHex('022449dfcc67599ef432c89d6e169694d6d9708fba8e8fd2ce4e387bccd38b5a89'),
	}, (err, response)=>{
		console.log(err,response)
	})

	await setupApp() // setup routes
	grpc.reconnectToLightning(Math.random(), function () {
		console.log(">>> FINISH SETUP")
		finishSetup()
	}) // recursive
}

async function finishSetup() {
	setupOwnerContact()
	await network.initTribesSubscriptions()
	if (config.hub_api_url) {
		checkInvitesHubInterval(5000)
	}
	if (config.unlock) { // IF UNLOCK, start this only after unlocked!
		pingHubInterval(15000)
	}
	setupDone()

	// scheduler: 35.236.110.178:2601

	// need to call "init" first (pass hex hsm_secret): https://github.com/Blockstream/greenlight/blob/main/libs/python/glapi/cli.py#L50
	// "Lightning Message" is appended on the HSMD itself
	// https://github.com/Blockstream/greenlight/blob/main/libs/python/glapi/cli.py#L57-L65
	
	// node bindings:
	// https://github.com/cdecker/lightning/tree/libhsmd-node/contrib/libhsmd_node

	let r = await lightning.keysend({
		amt: 300,
		dest: '02739d50cedddf3bd8affc8c978d19575c71bad1abfba90d9bcf90ea52aa7362ff',
		// route_hint: '0315fad9096f8addac2870ca00175d446ae41fe79084b98b5f0e268288ada32e61:2006338x19x0'
	})
	console.log(r)
}

function setupApp() {
	return new Promise(async resolve => {

		const app = express();

		app.use(helmet());
		app.use(express.json({ limit: '5MB' }));
		app.use(express.urlencoded());
		if (logging.Express) {
			app.use(logger)
		}
		app.use(cors({
			allowedHeaders: ['X-Requested-With', 'Content-Type', 'Accept', 'x-user-token', 'x-jwt']
		}))
		app.use(cookieParser())
		app.use(ownerMiddleware);
		app.use('/static', express.static('public'));
		app.get('/app', (req, res) => res.send('INDEX'))
		if (config.connect_ui) {
			app.get('/connect', connect.connect)
			app.post('/gen_channel', connect.genChannel)
		}

		let server;
		if ('ssl' in config && config.ssl.enabled) {
			try {
				var certData = await cert.getCertificate(config.public_url, config.ssl.port, config.ssl.save)
				var credentials = { key: certData?.privateKey.toString(), ca: certData?.caBundle, cert: certData?.certificate };
				server = require("https").createServer(credentials, app);
			} catch (e) {
				console.log("getCertificate ERROR", e)
			}
		} else {
			server = require("http").Server(app);
		}

		if (!server) return console.log("=> FAILED to create server")
		server.listen(port, (err) => {
			if (err) throw err;
			/* eslint-disable no-console */
			console.log(`Node listening on ${port}.`);
		});

		// start all routes!
		if (!config.unlock) {
			controllers.set(app);
			socket.connect(server)
			resolve(true)
		} else {
			app.post('/unlock', async function (req, res) {
				const ok = await unlocker(req, res)
				if (ok) {
					console.log('=> relay unlocked!')
					controllers.set(app);
					socket.connect(server)
					resolve(true)
				}
			})
		}

	})
}
