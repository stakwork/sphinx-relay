import * as WebSocket from 'ws'

let srvr: any

const connect = (server) => {
  srvr = new WebSocket.Server({ server, clientTracking:true })
  console.log('=> [socket] connected to server')

  srvr.on('connection', socket => {
    console.log('=> [socket] connection received')
  })
}

const send = (body) => {
  srvr.clients.forEach(c=>{
    if(c) c.send(body)
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
