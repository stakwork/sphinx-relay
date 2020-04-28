"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
let connections = new Map();
let connectionCounter = 0;
const connect = (server) => {
    server = new WebSocket.Server({ server });
    console.log('=> [socket] connected to server');
    server.on('connection', socket => {
        console.log('=> [socket] connection received');
        var id = connectionCounter++;
        connections.set(id, socket);
    });
};
exports.connect = connect;
const send = (body) => {
    connections.forEach((socket, index) => {
        socket.send(body);
    });
};
exports.send = send;
const sendJson = (object) => {
    send(JSON.stringify(object));
};
exports.sendJson = sendJson;
//# sourceMappingURL=socket.js.map