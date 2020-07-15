"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socketio = require("socket.io");
let io;
function connect(server) {
    io = socketio(server);
    io.on('connection', client => {
        console.log("=> [socket.io] connected!");
    });
}
exports.connect = connect;
exports.send = (body) => {
    io.sockets.emit('message', body);
};
exports.sendJson = (object) => {
    exports.send(JSON.stringify(object));
};
//# sourceMappingURL=socket.js.map