import { models, ContactRecord } from '../models'
import * as crypto from 'crypto'
import { sphinxLogger } from '../utils/logger'
import { generateTransportTokenKeys } from '../utils/cert'
import * as rsa from '../crypto/rsa'
import * as fs from 'fs'
import { loadConfig } from './config'

const config = loadConfig()

// import * as WebSocket from 'ws'

//The newer version of socket.io when imported has a
//different format than when we import it so we can ignore
//for now till we feel fine updating this
// eslint-disable-next-line
const socketio = require('socket.io')

type ClientMap = Record<number, any[]>
// { ownerID: [client1, client2] }
const CLIENTS: ClientMap = {}

let io: any
// let srvr: any

export function connect(server) {
  // srvr = new WebSocket.Server({ server, clientTracking:true })

  io = socketio(server, {
    allowEIO3: true,
    cors: {
      origin: true,
      allowedHeaders: [
        'Content-Type',
        'Accept',
        'x-user-token',
        'X-Requested-With',
      ],
      credentials: true,
    },
  })
  io.use(async (client, next) => {
    let userToken = client.handshake.headers['x-user-token']

    const x_transport_token = client.handshake.headers['x-transport-token']
    if (x_transport_token) {
      if (!fs.existsSync(config.transportPrivateKeyLocation)) {
        await generateTransportTokenKeys()
      }
      const transportPrivateKey = fs.readFileSync(
        config.transportPrivateKeyLocation
      )
      const userTokenFromTransportToken = rsa
        .decrypt(transportPrivateKey, x_transport_token)
        .split('|')[0]
      userToken = userTokenFromTransportToken
    }

    const owner = await getOwnerFromToken(userToken)
    if (owner) {
      client.ownerID = owner.id // add it in
      return next()
    }
    return next(new Error('authentication error'))
  })
  io.on('connection', (client) => {
    sphinxLogger.info(`=> [socket.io] connected! ${client.ownerID}`)
    addClient(client.ownerID, client)
    client.on('disconnect', (reason) => {
      removeClientById(client.ownerID, client.id)
      // console.log('=> [socket.io] disconnect', reason)
    })
  })
}

function addClient(id: number, client: any) {
  const existing = CLIENTS[id]
  if (existing && Array.isArray(existing)) {
    CLIENTS[id].push(client)
  }
  if (!existing) {
    CLIENTS[id] = [client]
  }
}

function removeClientById(id: number, clientID: string) {
  const existing = CLIENTS[id]
  if (!existing) return
  if (!existing.length) return
  const idx = existing.findIndex((c) => c.id === clientID)
  if (idx > -1) {
    CLIENTS[id].splice(idx, 1)
  }
}

async function getOwnerFromToken(
  token: string
): Promise<{ [k: string]: any } | null> {
  if (!token) return null
  const hashedToken = crypto.createHash('sha256').update(token).digest('base64')
  const owner: ContactRecord = (await models.Contact.findOne({
    where: { authToken: hashedToken, isOwner: true },
  })) as ContactRecord
  if (owner && owner.id) {
    return owner.dataValues // failed
  }
  return null
}

export const send = (body, tenant) => {
  if (!io) return // io.sockets.emit('message', body)
  const clients = CLIENTS[tenant]
  if (!clients) return
  clients.forEach((c) => c.emit('message', body))
}

export const sendJson = (object, tenant: number) => {
  send(JSON.stringify(object), tenant)
}
