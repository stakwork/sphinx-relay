import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as helmet from 'helmet'
import * as cookieParser from 'cookie-parser'
import * as cors from 'cors'
import * as crypto from 'crypto'
import * as path from 'path'
import {models} from './src/models'
import logger from './src/utils/logger'
import {pingHubInterval, checkInvitesHubInterval} from './src/hub'
import {setupDatabase, setupDone} from './src/utils/setup'
import * as controllers from './src/controllers'
import * as socket from './src/utils/socket'
import * as network from './src/network'

let server: any = null
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, 'config/app.json'))[env];
const port = process.env.PORT || 3001 // config.node_http_port || 3001

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

var i = 0

// START SETUP!
connectToLND()

async function connectToLND(){
	i++
	console.log(`=> [lnd] connecting... attempt #${i}`)
	try {
		await network.initGrpcSubscriptions()   // LND
		await mainSetup()						// DB + express
		await network.initTribesSubscriptions() // MQTT
	} catch(e) {
		if(e.details) {
			console.log(`=> [lnd] error details: ${e.details}`)
		} else {
			console.log(`=> [lnd] error: ${e.message}`)
		}
		setTimeout(async()=>{ // retry each 2 secs
			await connectToLND()
		},2000)
	}
}

async function mainSetup(){
	await setupDatabase();
	if (config.hub_api_url) {
		pingHubInterval(15000)
		checkInvitesHubInterval(5000)
	}
	await setupApp()
	setupDone()
}

async function setupApp(){
	const app = express();
	const server = require("http").Server(app);

	app.use(helmet());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(logger)
	app.use(cors({
		allowedHeaders:['X-Requested-With','Content-Type','Accept','x-user-token']
	}))
	app.use(cookieParser())
	if (env != 'development') {
		app.use(authModule);
	}
	app.use('/static', express.static('public'));
	app.get('/app', (req, res) => res.send('INDEX'))

	server.listen(port, (err) => {
		if (err) throw err;
		/* eslint-disable no-console */
		console.log(`Node listening on ${port}.`);
	});

	controllers.set(app);

	socket.connect(server)
}

async function authModule(req, res, next) {
	if (
		req.path == '/app' ||
		req.path == '/' ||
		req.path == '/info' ||
		req.path == '/action' ||
		req.path == '/contacts/tokens' ||
		req.path == '/latest' ||
		req.path.startsWith('/static') ||
		req.path == '/contacts/set_dev'
	) {
		next()
		return
	}

	if (process.env.HOSTING_PROVIDER==='true'){
		// const domain = process.env.INVITE_SERVER
		const host = req.headers.origin
		console.log('=> host:', host)
		const referer = req.headers.referer
		console.log('=> referer:', referer)
		if (req.path === '/invoices') {
			next()
			return
		}
	}

	const token = req.headers['x-user-token'] || req.cookies['x-user-token']

	if (token == null) {
		res.writeHead(401, 'Access invalid for user', {'Content-Type' : 'text/plain'});
    	res.end('Invalid credentials');
	} else {
		const user = await models.Contact.findOne({ where: { isOwner: true }})
		const hashedToken = crypto.createHash('sha256').update(token).digest('base64');
		if (user.authToken == null || user.authToken != hashedToken) {
			res.writeHead(401, 'Access invalid for user', {'Content-Type' : 'text/plain'});
			res.end('Invalid credentials');
		} else {
			next();
		}
	}
}

export default server
