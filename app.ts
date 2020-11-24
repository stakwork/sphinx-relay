import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as helmet from 'helmet'
import * as cookieParser from 'cookie-parser'
import * as cors from 'cors'
import * as path from 'path'
import logger from './src/utils/logger'
import {pingHubInterval, checkInvitesHubInterval} from './src/hub'
import {setupDatabase, setupDone} from './src/utils/setup'
import * as controllers from './src/controllers'
import * as socket from './src/utils/socket'
import * as network from './src/network'
import {authModule, unlocker} from './src/auth'
import * as grpc from './src/grpc'

const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, 'config/app.json'))[env];
const port = process.env.PORT || config.node_http_port || 3001

console.log("=> env:",env)
console.log('=> process.env.PORT:',process.env.PORT)
console.log('=> config.node_http_port:',config.node_http_port)

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

// START SETUP!
async function start(){
	await setupDatabase()
	connectToLND()
	pingHubInterval(15000)
}
start()

async function connectToLND(){
	// await unlocker here?
	grpc.reconnectToLND(Math.random(), function(){
		console.log(">> SETUP MAIN")
		mainSetup()
	}) // recursive
}

async function mainSetup(){
	await network.initTribesSubscriptions() 
	if (config.hub_api_url) {
		// pingHubInterval(15000)
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

	// start all routes!
	if(!config.unlock) {
		controllers.set(app);
		socket.connect(server)
	} else {
		app.post('/unlock', async function(req,res){
			const ok = await unlocker(req,res)
			if(ok) {
				console.log('=> relay unlocked!')
				controllers.set(app);
				socket.connect(server)
			}
		}) 
	}
}
