const socketio = require("socket.io");

let io: any

export function connect(server) {
  io = socketio(server);
  io.on('connection', client => {
    console.log("=> [socket.io] connected!")
  });
}

export const send = (body) => {
  io.sockets.emit('message',body)
}

export const sendJson = (object) => {
  send(JSON.stringify(object))
}
