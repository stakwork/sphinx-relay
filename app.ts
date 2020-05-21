import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as helmet from 'helmet'
import * as cookieParser from 'cookie-parser'
import * as crypto from 'crypto'
import * as path from 'path'
import {models} from './api/models'
import logger from './api/utils/logger'
import {pingHubInterval, checkInvitesHubInterval} from './api/hub'
import {setupDatabase, setupDone} from './api/utils/setup'
import * as controllers from './api/controllers'
import * as socket from './api/utils/socket'
import * as network from './api/network'

let server: any = null
const port = process.env.PORT || 3001;
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, 'config/app.json'))[env];

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
		}
		setTimeout(async()=>{ // retry each 2 secs
			await connectToLND()
		},2000)
	}
}

async function mainSetup(){
	await setupDatabase();
	if (config.hub_api_url) {
		pingHubInterval(5000)
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
	app.options('*', (req, res) => res.send(200));
	app.use((req, res, next) => {
		res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
		res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
		res.setHeader('Expires', '-1');
		res.setHeader('Pragma', 'no-cache');
		next();
	});
	app.use(cookieParser())
	if (env != 'development') {
		app.use(authModule);
	}
	app.use('/static', express.static('public'));
	app.get('/app', (req, res) => res.sendFile(__dirname + '/public/index.html'))

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
		req.path == '/contacts/tokens' ||
		req.path == '/login' ||
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
