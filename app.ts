import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as helmet from 'helmet'
import * as cookieParser from 'cookie-parser'
import * as cors from 'cors'
import logger from './src/utils/logger'
import { pingHubInterval, checkInvitesHubInterval } from './src/hub'
import { setupDatabase, setupDone, setupOwnerContact } from './src/utils/setup'
import * as controllers from './src/controllers'
import * as connect from './src/utils/connect'
import * as socket from './src/utils/socket'
import * as network from './src/network'
import { authModule, unlocker } from './src/auth'
import * as grpc from './src/grpc'
import * as cert from './src/utils/cert'
import {loadConfig} from './src/utils/config'

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
	}
}
start()

async function mainSetup() {
	await setupApp() // setup routes
	grpc.reconnectToLND(Math.random(), function () {
		console.log(">> FINISH SETUP")
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
}

function setupApp() {
	return new Promise(async resolve => {

		const app = express();

		app.use(helmet());
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: true }));
		app.use(logger)
		app.use(cors({
			allowedHeaders: ['X-Requested-With', 'Content-Type', 'Accept', 'x-user-token']
		}))
		app.use(cookieParser())
		if (env != 'development') {
			app.use(authModule);
		}
		app.use('/static', express.static('public'));
		app.get('/app', (req, res) => res.send('INDEX'))
		if (config.connect_ui) {
			app.get('/connect', connect.connect)
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
