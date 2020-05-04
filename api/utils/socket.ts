import * as WebSocket from 'ws'

// let connections = new Map()
// let connectionCounter = 0

let lastConn: any

const connect = (server) => {
  server = new WebSocket.Server({ server })

  console.log('=> [socket] connected to server')

  server.on('connection', socket => {
    console.log('=> [socket] connection received')
    // var id = connectionCounter++;
    // connections.set(id, socket)
    lastConn = socket
  })

}

const send = (body) => {
  // connections.forEach((socket, index) => {
  //   socket.send(body)
  // })
  lastConn.send(body)
}

const sendJson = (object) => {
  send(JSON.stringify(object))
}

export {
  connect,
  send,
  sendJson
}
