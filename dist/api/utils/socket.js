"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as WebSocket from 'ws'
const socketio = require("socket.io");
let io;
// let srvr: any
function connect(server) {
    // srvr = new WebSocket.Server({ server, clientTracking:true })
    io = socketio(server);
    io.on('connection', client => {
        console.log("=> [socket.io] connected!");
    });
}
exports.connect = connect;
exports.send = (body) => {
    if (io)
        io.sockets.emit('message', body);
    // if(srvr){
    //   srvr.clients.forEach(c=>{
    //     if(c) c.send(body)
    //   })
    // }
};
exports.sendJson = (object) => {
    exports.send(JSON.stringify(object));
};
//# sourceMappingURL=socket.js.map