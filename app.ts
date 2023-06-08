import * as express from 'express'
import * as helmet from 'helmet'
import * as cookieParser from 'cookie-parser'
import * as cors from 'cors'
import * as https from 'https'
import * as http from 'http'
import logger, { logging, sphinxLogger } from './src/utils/logger'
import { pingHubInterval, checkInvitesHubInterval } from './src/hub'
import { genUsersInterval } from './src/utils/proxy'
import {
  setupDatabase,
  setupDone,
  setupOwnerContact,
  setupPersonUuid,
  updateLsat,
  updateTotalMsgPerTribe,
} from './src/utils/setup'
import * as controllers from './src/controllers'
import * as connect from './src/utils/connect'
import * as socket from './src/utils/socket'
import * as network from './src/network'
import { hmacMiddleware, ownerMiddleware, unlocker } from './src/auth'
import * as grpc from './src/grpc/subscribe'
import * as cert from './src/utils/cert'
import { loadConfig } from './src/utils/config'
import { Req } from './src/types'
import { leadershipBoardInterval } from './src/leadershipboard'

// force UTC time
process.env.TZ = 'UTC'

const env = process.env.NODE_ENV || 'development'
const config = loadConfig()
const port = process.env.PORT || config.node_http_port || 3001

sphinxLogger.info(['=> env', env])
//sphinxLogger.info(['=> config', config])

process.env.GRPC_SSL_CIPHER_SUITES =
  'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384'
process.env.NODE_EXTRA_CA_CERTS = config.tls_location

// START SETUP!
async function start() {
  await setupDatabase()
  mainSetup()
  // // IF NOT UNLOCK, go ahead and start this now
  if (config.hub_api_url && !config.unlock) {
    pingHubInterval(30000)
    genUsersInterval(60000)
  }
}
start()

async function mainSetup() {
  const app: any = await setupApp() // setup routes
  grpc.reconnectToLightning(Math.random(), async function () {
    sphinxLogger.info('>>> FINISH SETUP')
    await finishSetup()
    app.get('/is_setup', (req, res) => res.send(true))
  }) // recursive
}

async function finishSetup() {
  await setupOwnerContact()
  await setupPersonUuid()
  await updateLsat()
  await updateTotalMsgPerTribe()
  await network.initTribesSubscriptions()
  if (config.hub_api_url) {
    checkInvitesHubInterval(5000)
  }
  if (config.unlock) {
    // IF UNLOCK, start this only after unlocked!
    pingHubInterval(15000)
  }
  leadershipBoardInterval(1800000)
  setupDone()
}

function setupApp() {
  return new Promise(async (resolve) => {
    const app = express()

    if (config.rate_limit_trust_proxy) {
      const rate_limit_trust_proxy = parseInt(config.rate_limit_trust_proxy)
      if (rate_limit_trust_proxy > 0) {
        app.set('trust proxy', rate_limit_trust_proxy)
      }
    }

    app.use(helmet())
    app.use(
      express.json({
        limit: '5MB',
        verify: (req, res, buf) => {
          ;(req as any).rawBody = buf.toString()
        },
      })
    )
    app.use(express.urlencoded())
    if (logging.Express) {
      app.use(logger)
    }
    app.use(
      cors({
        allowedHeaders: [
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'x-user-token',
          'x-jwt',
          'x-hub-signature-256',
          'x-hmac',
        ],
      })
    )
    app.use(cookieParser())
    app.use(ownerMiddleware)
    app.use(hmacMiddleware)
    app.use('/static', express.static('public'))
    app.get('/app', (req, res) => res.send('INDEX'))
    if (config.connect_ui) {
      app.get('/connect', connect.connect)
      app.post('/gen_channel', connect.genChannel)
      app.post('/connect_peer', connect.connectPeer)
      app.get('/peered', connect.checkPeered)
    }

    let server
    if ('ssl' in config && config.ssl.enabled) {
      try {
        const certData = await cert.getCertificate(
          config.public_url,
          config.ssl.port,
          config.ssl.save
        )
        const credentials = {
          key: certData?.privateKey.toString(),
          ca: certData?.caBundle,
          cert: certData?.certificate,
        }
        server = https.createServer(credentials, app)
      } catch (e) {
        sphinxLogger.info(['getCertificate ERROR', e])
      }
    } else {
      server = http.createServer(app)
    }

    if (!server) return sphinxLogger.info('=> FAILED to create server')
    server.listen(port, (err) => {
      if (err) throw err
      /* eslint-disable no-console */
      sphinxLogger.info(`Node listening on ${port}.`)
    })

    // process.on('SIGTERM', () => {
    //   server.close(function () {
    //     process.exit(0)
    //   })
    // })

    // process.on('exit', () => {
    //   server.close(function () {
    //     process.exit(0)
    //   })
    // })

    // start all routes!
    if (!config.unlock) {
      controllers.set(app)
      socket.connect(server)
      resolve(app)
    } else {
      app.post('/unlock', async function (req: Req, res) {
        const ok = await unlocker(req, res)
        if (ok) {
          sphinxLogger.info('=> relay unlocked!')
          controllers.set(app)
          socket.connect(server)
          resolve(app)
        }
      })
    }
  })
}
