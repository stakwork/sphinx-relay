import * as WebSocket from 'ws'

// let connections = new Map()
// let connectionCounter = 0

// let lastConn: any
let srvr: any

const connect = (server) => {
  srvr = new WebSocket.Server({ server, clientTracking:true })
  console.log('=> [socket] connected to server')

  srvr.on('connection', socket => {
    console.log('=> [socket] connection received')
    // var id = connectionCounter++;
    // connections.set(id, socket)
    // lastConn = socket
  })

}

const send = (body) => {
  // connections.forEach((socket, index) => {
  //   socket.send(body)
  // })
  // if(lastConn) lastConn.send(body)
  srvr.clients.forEach(c=>{
    if(c && c.connected) {
      c.send(body)
    }
  })
}

const sendJson = (object) => {
  send(JSON.stringify(object))
}

export {
  connect,
  send,
  sendJson
}
