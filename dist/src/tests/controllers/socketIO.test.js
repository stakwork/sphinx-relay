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
const base64images_1 = require("../utils/base64images");
const nodes_1 = require("../nodes");
const helpers_1 = require("../utils/helpers");
//import { tribe3Msgs } from './tribe3Messages.test'
const msg_1 = require("../utils/msg");
const save_1 = require("../utils/save");
const del_1 = require("../utils/del");
let handlers = {};
let io = null;
var responseArray = [];
ava_1.default.serial('test-09-socketIO', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield testSocketIO(t, false);
    yield testSocketIO(t, true);
}));
function testSocketIO(t, legacy) {
    return __awaiter(this, void 0, void 0, function* () {
        connectWebSocket('http://localhost:3002', nodes_1.default[1].authToken, legacy, () => { }, () => { });
        io.connect();
        yield (0, save_1.addContact)(t, nodes_1.default[0], nodes_1.default[1]);
        //*******
        //Receive payment
        //payment.ts
        const amount = 101;
        const paymentText = 'this eleven payment';
        yield (0, msg_1.sendPayment)(t, nodes_1.default[0], nodes_1.default[1], amount, paymentText);
        const payment = yield (0, msg_1.sendPayment)(t, nodes_1.default[0], nodes_1.default[1], amount, paymentText);
        t.true(payment, 'payment should be sent');
        t.true(responseArray[responseArray.length - 1].response.contact.public_key ==
            nodes_1.default[0].pubkey, 'payment should be sent');
        t.true(responseArray[responseArray.length - 1].response.amount == amount, 'payment should be sent with correct amount');
        t.true(responseArray[responseArray.length - 1].type == 'direct_payment', 'payment should have the correct type');
        //*******
        //Recieve message
        //messages.ts
        //********
        const messageText = (0, helpers_1.randomText)();
        const sentMessage = yield (0, msg_1.sendMessageAndCheckDecryption)(t, nodes_1.default[0], nodes_1.default[1], messageText);
        t.true(responseArray[responseArray.length - 1].type == 'message', 'we should get back something when we recieve a message');
        //*****
        //recieve boost
        //messages.ts
        //*******
        const socketTribe = yield (0, save_1.createTribe)(t, nodes_1.default[0]);
        yield (0, save_1.joinTribe)(t, nodes_1.default[1], socketTribe);
        const tribeMessage = yield (0, msg_1.sendTribeMessage)(t, nodes_1.default[1], socketTribe, messageText);
        yield (0, msg_1.sendBoost)(t, nodes_1.default[0], nodes_1.default[1], tribeMessage, 10, socketTribe);
        t.true(responseArray[responseArray.length - 4].type == 'confirmation', 'we should receive a confirmation');
        t.true(responseArray[responseArray.length - 3].type == 'message', 'we should receive a message');
        t.true(responseArray[responseArray.length - 2].type == 'group_join', 'we should get back something when we join a tribe group chat');
        t.true(responseArray[responseArray.length - 1].type == 'boost', 'we should receive a boost');
        yield (0, del_1.deleteMessage)(t, nodes_1.default[0], sentMessage.id);
        yield (0, helpers_1.sleep)(1000);
        t.true(responseArray[responseArray.length - 1].type == 'delete', 'we should get back a delete type');
        /*******
         * Recieve Invoice
         */
        yield (0, msg_1.sendInvoice)(t, nodes_1.default[0], nodes_1.default[1], 11, 'Invoice sample text');
        yield (0, helpers_1.sleep)(1000);
        t.true(responseArray[responseArray.length - 1].type == 'invoice', 'we should get back a invoice type');
        /*
         * Recieve Purchase
         */
        yield (0, msg_1.sendImage)(t, nodes_1.default[0], nodes_1.default[1], base64images_1.greenSquare, null, 10);
        yield (0, helpers_1.sleep)(1000);
        t.true(responseArray[responseArray.length - 2].type == 'attachment', 'we should get back a attachment type');
        t.true(responseArray[responseArray.length - 1].type == 'purchase_accept', 'we should get back a purchase_accept type');
        //getting the socket io messages sending image the other way
        yield (0, msg_1.sendImage)(t, nodes_1.default[1], nodes_1.default[0], base64images_1.greenSquare, null, 10);
        yield (0, helpers_1.sleep)(1000);
        t.true(responseArray[responseArray.length - 3].type == 'confirmation', 'we should get back a attachment type');
        t.true(responseArray[responseArray.length - 2].type == 'purchase', 'we should get back a purchase type');
        t.true(responseArray[responseArray.length - 1].type == 'purchase_accept', 'we should get back a purchase_accept type');
        yield (0, helpers_1.sleep)(10000);
        yield (0, save_1.joinTribe)(t, nodes_1.default[2], socketTribe);
        yield (0, del_1.leaveTribe)(t, nodes_1.default[2], socketTribe);
        yield (0, helpers_1.sleep)(10000);
        t.true(responseArray[responseArray.length - 2].type == 'group_join', 'we should get back a purchase type');
        t.true(responseArray[responseArray.length - 1].type == 'group_leave', 'we should get back a purchase_accept type');
        yield (0, del_1.deleteTribe)(t, nodes_1.default[0], socketTribe);
        yield (0, helpers_1.sleep)(1000);
        t.true(responseArray[responseArray.length - 1].type == 'tribe_delete', 'we should get back a purchase_accept type');
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