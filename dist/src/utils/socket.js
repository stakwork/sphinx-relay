"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendJson = exports.send = exports.connect = void 0;
const models_1 = require("../models");
const crypto = require("crypto");
const fs = require("fs");
const config_1 = require("./config");
const logger_1 = require("../utils/logger");
const cert_1 = require("../utils/cert");
const rsa = require("../crypto/rsa");
const config = (0, config_1.loadConfig)();
// import * as WebSocket from 'ws'
//The newer version of socket.io when imported has a
//different format than when we import it so we can ignore
//for now till we feel fine updating this
// eslint-disable-next-line
const socketio = require('socket.io');
// { ownerID: [client1, client2] }
const CLIENTS = {};
let io;
// let srvr: any
function connect(server) {
    // srvr = new WebSocket.Server({ server, clientTracking:true })
    io = socketio(server, {
        allowEIO3: true,
        cors: {
            origin: true,
            allowedHeaders: [
                'Content-Type',
                'Accept',
                'x-user-token',
                'X-Requested-With',
            ],
            credentials: true,
        },
    });
    io.use((client, next) => __awaiter(this, void 0, void 0, function* () {
        let userToken = client.handshake.headers['x-user-token'];
        const x_transport_token = client.handshake.headers['x-transport-token'];
        if (x_transport_token) {
            if (!fs.existsSync(config.transportPrivateKeyLocation)) {
                yield (0, cert_1.generateTransportTokenKeys)();
            }
            const transportPrivateKey = fs.readFileSync(config.transportPrivateKeyLocation);
            const userTokenFromTransportToken = rsa
                .decrypt(transportPrivateKey, x_transport_token)
                .split('|')[0];
            userToken = userTokenFromTransportToken;
        }
        const owner = yield getOwnerFromToken(userToken);
        if (owner) {
            client.ownerID = owner.id; // add it in
            return next();
        }
        return next(new Error('authentication error'));
    }));
    io.on('connection', (client) => {
        logger_1.sphinxLogger.info(`=> [socket.io] connected! ${client.ownerID}`);
        addClient(client.ownerID, client);
        client.on('disconnect', (reason) => {
            removeClientById(client.ownerID, client.id);
            // console.log('=> [socket.io] disconnect', reason)
        });
    });
}
exports.connect = connect;
function addClient(id, client) {
    const existing = CLIENTS[id];
    if (existing && Array.isArray(existing)) {
        CLIENTS[id].push(client);
    }
    if (!existing) {
        CLIENTS[id] = [client];
    }
}
function removeClientById(id, clientID) {
    const existing = CLIENTS[id];
    if (!existing)
        return;
    if (!existing.length)
        return;
    const idx = existing.findIndex((c) => c.id === clientID);
    if (idx > -1) {
        CLIENTS[id].splice(idx, 1);
    }
}
function getOwnerFromToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!token)
            return null;
        const hashedToken = crypto.createHash('sha256').update(token).digest('base64');
        const owner = (yield models_1.models.Contact.findOne({
            where: { authToken: hashedToken, isOwner: true },
        }));
        if (owner && owner.id) {
            return owner.dataValues; // failed
        }
        return null;
    });
}
const send = (body, tenant) => {
    if (!io)
        return; // io.sockets.emit('message', body)
    const clients = CLIENTS[tenant];
    if (!clients)
        return;
    clients.forEach((c) => c.emit('message', body));
};
exports.send = send;
const sendJson = (object, tenant) => {
    (0, exports.send)(JSON.stringify(object), tenant);
};
exports.sendJson = sendJson;
//# sourceMappingURL=socket.js.map