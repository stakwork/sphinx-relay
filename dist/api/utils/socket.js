"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socketio = require("socket.io");
let io;
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
        console.log("=> [socket.io] connected!");
        client.on('event', data => { });
        client.on('disconnect', () => { });
        io.sockets.send('{"try":"try"}');
    });
}
exports.connect = connect;
const send = (body) => {
    // srvr.clients.forEach(c=>{
    //   if(c) c.send(body)
    // })
    io.sockets.send(body);
};
exports.send = send;
const sendJson = (object) => {
    send(JSON.stringify(object));
};
exports.sendJson = sendJson;
//# sourceMappingURL=socket.js.map