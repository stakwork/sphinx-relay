const socketio = require("socket.io");

let io: any

function connect(server) {
  io = socketio(server, {
    // path: '/socket',
    serveClient: false,
    // below are engine.IO options
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
  });

  io.on('connection', client => {
    console.log("=> [socket.io] connected!")
    client.on('event', data => { /* … */ });
    client.on('disconnect', () => { /* … */ });
  });
}

const send = (body) => {
  // srvr.clients.forEach(c=>{
  //   if(c) c.send(body)
  // })
  io.sockets.send(body)
}

const sendJson = (object) => {
  send(JSON.stringify(object))
}

export {
  connect,
  send,
  sendJson
}
