import { models } from '../models'
import * as crypto from 'crypto'

// import * as WebSocket from 'ws'
const socketio = require("socket.io");

type ClientMap = Record<number, any[]>;
// { ownerID: [client1, client2] }
const CLIENTS:ClientMap = {}

let io: any
// let srvr: any

export function connect(server) {
  // srvr = new WebSocket.Server({ server, clientTracking:true })

  io = socketio(server, {
    handlePreflightRequest: (req, res) => {
      const headers = {
        "Access-Control-Allow-Headers": "Content-Type, Accept, x-user-token, X-Requested-With",
        "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
        "Access-Control-Allow-Credentials": true
      };
      res.writeHead(200, headers);
      res.end();
    }
  });
  io.use(async (client, next) => {
    let userToken = client.handshake.headers['x-user-token'];
    const owner = await getOwnerFromToken(userToken)
    if (owner) {
      client.ownerID = owner.id
      addClient(owner.id, client)
      return next();
    }
    return next(new Error('authentication error'));
  });
  io.on('connection', (client)=> {
    console.log("=> [socket.io] connected!", client.id, client.ownerID)
    client.on('disconnect', (reason) => {
      console.log('=> [socket.io] disconnect', reason)
    });
  });
}

function addClient(id: number, client:any){
  const existing = CLIENTS[id]
  if(existing && Array.isArray(existing)) {
    CLIENTS[id].push(client)
  }
  if(!existing) {
    CLIENTS[id] = [client]
  }
}

async function getOwnerFromToken(token: string): Promise<{[k:string]:any}|null> {
  if (!token) return null
  const hashedToken = crypto.createHash('sha256').update(token).digest('base64');
  const owner = await models.Contact.findOne({ where: { authToken: hashedToken, isOwner:true } })
  if (owner && owner.id) {
    return owner.dataValues // failed
  }
  return null
}

export const send = (body) => {
  if (io) io.sockets.emit('message', body)

  // if(srvr){
  //   srvr.clients.forEach(c=>{
  //     if(c) c.send(body)
  //   })
  // }
}

export const sendJson = (object) => {
  send(JSON.stringify(object))
}
