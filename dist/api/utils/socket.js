"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
// let connections = new Map()
// let connectionCounter = 0
// let lastConn: any
let srvr;
const connect = (server) => {
    srvr = new WebSocket.Server({ server, clientTracking: true });
    console.log('=> [socket] connected to server');
    srvr.on('connection', socket => {
        console.log('=> [socket] connection received');
        // var id = connectionCounter++;
        // connections.set(id, socket)
        // lastConn = socket
        console.log(srvr);
    });
};
exports.connect = connect;
const send = (body) => {
    console.log(srvr);
    // connections.forEach((socket, index) => {
    //   socket.send(body)
    // })
    // if(lastConn) lastConn.send(body)
    srvr.clients.forEach(c => {
        if (c && c.connected) {
            c.send(body);
        }
    });
};
exports.send = send;
const sendJson = (object) => {
    send(JSON.stringify(object));
};
exports.sendJson = sendJson;
//# sourceMappingURL=socket.js.map