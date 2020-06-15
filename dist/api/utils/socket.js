"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
let srvr;
const connect = (server) => {
    srvr = new WebSocket.Server({ server, clientTracking: true });
    console.log('=> [socket] connected to server');
    srvr.on('connection', socket => {
        console.log('=> [socket] connection received');
    });
};
exports.connect = connect;
const send = (body) => {
    srvr.clients.forEach(c => {
        if (c)
            c.send(body);
    });
};
exports.send = send;
const sendJson = (object) => {
    send(JSON.stringify(object));
};
exports.sendJson = sendJson;
//# sourceMappingURL=socket.js.map