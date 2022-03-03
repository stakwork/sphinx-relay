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
exports.connectWebSocket = void 0;
const ava_1 = require("ava");
const socketio = require("socket.io-client");
const socketiolegacy = require("socket.io-client-legacy");
const nodes_1 = require("../nodes");
//import { tribe3Msgs } from './tribe3Messages.test'
const msg_1 = require("../utils/msg");
const save_1 = require("../utils/save");
let handlers = {};
let io = null;
var responseArray = [];
ava_1.default.serial('test-09-chatInvoice: add contact, send invoices, pay invoices, delete contact', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield testSocketIO(t, false);
    yield testSocketIO(t, true);
}));
function testSocketIO(t, legacy) {
    return __awaiter(this, void 0, void 0, function* () {
        connectWebSocket('http://localhost:3001', nodes_1.default[0].authToken, legacy, () => { }, () => { });
        io.connect();
        //    tribe3Msgs(t, nodes[0], nodes[1], nodes[2])
        yield (0, save_1.addContact)(t, nodes_1.default[0], nodes_1.default[1]);
        //*******
        //Receive payment
        //payment.ts
        const amount = 101;
        const paymentText = 'this eleven payment';
        const payment = yield (0, msg_1.sendPayment)(t, nodes_1.default[1], nodes_1.default[0], amount, paymentText);
        t.true(payment, 'payment should be sent');
        t.true(responseArray[responseArray.length - 1].response.contact.public_key ==
            nodes_1.default[1].pubkey, 'payment should be sent');
        t.true(responseArray[responseArray.length - 1].response.amount == amount, 'payment should be sent');
        t.true(responseArray[responseArray.length - 1].type == 'direct_payment', 'payment should be sent');
        //******
        //Receive Invoice
        //invoices.ts
        //******
    });
}
function connectWebSocket(ip, authToken, legacy, connectedCallback, disconnectCallback) {
    if (io) {
        return; // dont reconnect if already exists
    }
    if (!legacy) {
        io = socketio.connect(ip, {
            reconnection: true,
            extraHeaders: {
                'x-user-token': authToken,
            },
        });
    }
    else {
        io = socketiolegacy.connect(ip, {
            reconnection: true,
            extraHeaders: {
                'x-user-token': authToken,
            },
        });
    }
    io.on('connect', (socket) => {
        console.log('=> socketio connected!');
        if (connectedCallback)
            connectedCallback();
    });
    io.on('disconnect', (socket) => {
        if (disconnectCallback)
            disconnectCallback();
    });
    io.on('message', (data) => {
        console.log('recived message: ', JSON.parse(data));
        responseArray.push(JSON.parse(data));
        try {
            let msg = JSON.parse(data);
            let typ = msg.type;
            if (typ === 'delete')
                typ = 'deleteMessage';
            let handler = handlers[typ];
            if (handler) {
                handler(msg);
            }
        }
        catch (e) { }
    });
    io.on('error', function (e) {
        console.log('socketio error', e);
    });
}
exports.connectWebSocket = connectWebSocket;
//# sourceMappingURL=socketIO.test.js.map