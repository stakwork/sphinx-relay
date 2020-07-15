"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const socketio = require("socket.io");
let io;
let srvr;
function connect(server) {
    io = socketio(server);
    io.on('connection', client => {
        console.log("=> [socket.io] connected!");
    });
    srvr = new WebSocket.Server({ server, clientTracking: true });
}
exports.connect = connect;
exports.send = (body) => {
    if (io)
        io.sockets.emit('message', body);
    if (srvr) {
        srvr.clients.forEach(c => {
            if (c)
                c.send(body);
        });
    }
};
exports.sendJson = (object) => {
    exports.send(JSON.stringify(object));
};
//# sourceMappingURL=socket.js.map