// import * as WebSocket from 'ws'
const socketio = require("socket.io");

let io: any
// let srvr: any

export function connect(server) {
  // srvr = new WebSocket.Server({ server, clientTracking:true })

  io = socketio(server);
  io.on('connection', client => {
    console.log("=> [socket.io] connected!")
  });
}

export const send = (body) => {
  if(io) io.sockets.emit('message',body)

  // if(srvr){
  //   srvr.clients.forEach(c=>{
  //     if(c) c.send(body)
  //   })
  // }
}

export const sendJson = (object) => {
  send(JSON.stringify(object))
}
