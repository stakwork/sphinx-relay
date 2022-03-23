import { models } from '../models'
import * as crypto from 'crypto'
import * as fs from 'fs'
import { loadConfig } from './config'
import { sphinxLogger } from '../utils/logger'
import * as socketio from 'socket.io'
const config = loadConfig()
// import * as WebSocket from 'ws'

type ClientMap = Record<number, any[]>
// { ownerID: [client1, client2] }
const CLIENTS: ClientMap = {}

let io: any
// let srvr: any

export function connect(server) {
  // srvr = new WebSocket.Server({ server, clientTracking:true })

  io = socketio(server, {
    handlePreflightRequest: (req, res) => {
      const headers = {
        'Access-Control-Allow-Headers':
          'Content-Type, Accept, x-user-token, X-Requested-With',
        'Access-Control-Allow-Origin': req.headers.origin, //or the specific origin you want to give access to,
        'Access-Control-Allow-Credentials': true,
      }
      res.writeHead(200, headers)
      res.end()
    },
  })
  io.use(async (client, next) => {
    let userToken = client.handshake.headers['x-user-token']

    const x_transport_token = client.handshake.headers['x-transport-token']
    if (x_transport_token) {
      const transportPrivateKey = fs.readFileSync(
        config.transportPrivateKeyLocation
      )
      const userTokenFromTransportToken = crypto
        .privateDecrypt(transportPrivateKey, x_transport_token)
        .toString()
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
  const owner = await models.Contact.findOne({
    where: { authToken: hashedToken, isOwner: true },
  })
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
