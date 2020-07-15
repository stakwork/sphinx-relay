const socketio = require("socket.io");

let io: any

function connect(server) {
  io = socketio(server);

  io.on('connection', client => {
    console.log("=> [socket.io] connected!")
    client.on('event', data => { /* … */ });
    client.on('disconnect', () => { /* … */ });

    setTimeout(()=>{
      client.emit('message','wazzup')
    },3000)
    // io.sockets.send('{"try":"try"}')
    // client.send('{"try":"try"}')
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
