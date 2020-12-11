import { models } from '../models'
import * as crypto from 'crypto'

// import * as WebSocket from 'ws'
const socketio = require("socket.io");

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
  io.use(async (socket, next) => {
    let userToken = socket.handshake.headers['x-user-token'];
    const isValid = await isValidToken(userToken)
    if (isValid) {
      return next();
    }
    return next(new Error('authentication error'));
  });
  io.on('connection', client => {
    console.log("=> [socket.io] connected!")
  });
}

async function isValidToken(token: string): Promise<Boolean> {
  if (!token) return false
  const user = await models.Contact.findOne({ where: { isOwner: true } })
  const hashedToken = crypto.createHash('sha256').update(token).digest('base64');
  if (user.authToken == null || user.authToken != hashedToken) {
    return false // failed
  }
  return true
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
