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
const models_1 = require("../models");
const socket = require("../utils/socket");
const hub_1 = require("../hub");
const jsonUtils = require("../utils/json");
const decodeUtils = require("../utils/decode");
const lightning_1 = require("../utils/lightning");
const controllers = require("../controllers");
const moment = require("moment");
const path = require("path");
const constants = require(path.join(__dirname, '../../config/constants.json'));
// VERIFY PUBKEY OF SENDER
function parseAndVerifyPayload(data) {
    return __awaiter(this, void 0, void 0, function* () {
        let payload;
        const li = data.lastIndexOf('}');
        const msg = data.substring(0, li + 1);
        const sig = data.substring(li + 1);
        try {
            payload = JSON.parse(msg);
            if (payload) {
                const v = yield lightning_1.verifyAscii(msg, sig);
                if (v && v.valid && v.pubkey) {
                    payload.sender = payload.sender || {};
                    payload.sender.pub_key = v.pubkey;
                    return payload;
                }
                else {
                    console.error('[GRPC] invalid payload signature');
                }
            }
        }
        catch (e) {
            console.error('[GRPC] failed to parse msg');
            return null;
        }
    });
}
function parseKeysendInvoice(i, actions) {
    return __awaiter(this, void 0, void 0, function* () {
        const recs = i.htlcs && i.htlcs[0] && i.htlcs[0].custom_records;
        const buf = recs && recs[lightning_1.SPHINX_CUSTOM_RECORD_KEY];
        const data = buf && buf.toString();
        const value = i && i.value && parseInt(i.value);
        if (!data) {
            console.error('[GRPC] no keysend data received');
            return;
        }
        let payload;
        if (data[0] === '{') {
            try {
                payload = yield parseAndVerifyPayload(data);
            }
            catch (e) {
                console.error('[GRPC] failed to parse and verify payload');
            }
        }
        else {
            const threads = weave(data);
            if (threads) {
                try {
                    payload = yield parseAndVerifyPayload(threads);
                }
                catch (e) {
                    console.error('[GRPC] failed to parse and verify payload II');
                }
            }
        }
        if (payload) {
            const dat = payload.content || payload;
            if (value && dat && dat.message) {
                dat.message.amount = value; // ADD IN TRUE VALUE
            }
            if (actions[payload.type]) {
                actions[payload.type](payload);
            }
            else {
                console.log('Incorrect payload type:', payload.type);
            }
        }
        else {
            console.error('[GRPC] no payload');
        }
    });
}
const chunks = {};
function weave(p) {
    const pa = p.split('_');
    if (pa.length < 4)
        return;
    const ts = pa[0];
    const i = pa[1];
    const n = pa[2];
    const m = pa.filter((u, i) => i > 2).join('_');
    chunks[ts] = chunks[ts] ? [...chunks[ts], { i, n, m }] : [{ i, n, m }];
    if (chunks[ts].length === parseInt(n)) {
        // got em all!
        const all = chunks[ts];
        let payload = '';
        all.slice().sort((a, b) => a.i - b.i).forEach(obj => {
            payload += obj.m;
        });
        delete chunks[ts];
        return payload;
    }
}
function subscribeInvoices(actions) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const lightning = yield lightning_1.loadLightning();
        var call = lightning.subscribeInvoices();
        call.on('data', function (response) {
            return __awaiter(this, void 0, void 0, function* () {
                // console.log('subscribed invoices', { response })
                console.log('[GRPC] subscribeInvoices response', response);
                if (response['state'] !== 'SETTLED') {
                    return;
                }
                // console.log("IS KEYSEND", response.is_keysend)
                if (response.is_keysend) {
                    parseKeysendInvoice(response, actions);
                }
                else {
                    const invoice = yield models_1.models.Message.findOne({ where: { type: constants.message_types.invoice, payment_request: response['payment_request'] } });
                    if (invoice == null) {
                        // console.log("ERROR: Invoice " + response['payment_request'] + " not found");
                        const payReq = response['payment_request'];
                        const amount = response['amt_paid_sat'];
                        if (process.env.HOSTING_PROVIDER === 'true') {
                            hub_1.sendInvoice(payReq, amount);
                        }
                        socket.sendJson({
                            type: 'invoice_payment',
                            response: { invoice: payReq }
                        });
                        return;
                    }
                    models_1.models.Message.update({ status: constants.statuses.confirmed }, { where: { id: invoice.id } });
                    let decodedPaymentRequest = decodeUtils.decode(response['payment_request']);
                    var paymentHash = "";
                    for (var i = 0; i < decodedPaymentRequest["data"]["tags"].length; i++) {
                        let tag = decodedPaymentRequest["data"]["tags"][i];
                        if (tag['description'] == 'payment_hash') {
                            paymentHash = tag['value'];
                            break;
                        }
                    }
                    let settleDate = parseInt(response['settle_date'] + '000');
                    const chat = yield models_1.models.Chat.findOne({ where: { id: invoice.chatId } });
                    const contactIds = JSON.parse(chat.contactIds);
                    const senderId = contactIds.find(id => id != invoice.sender);
                    const message = yield models_1.models.Message.create({
                        chatId: invoice.chatId,
                        type: constants.message_types.payment,
                        sender: senderId,
                        amount: response['amt_paid_sat'],
                        amountMsat: response['amt_paid_msat'],
                        paymentHash: paymentHash,
                        date: new Date(settleDate),
                        messageContent: response['memo'],
                        status: constants.statuses.confirmed,
                        createdAt: new Date(settleDate),
                        updatedAt: new Date(settleDate)
                    });
                    const sender = yield models_1.models.Contact.findOne({ where: { id: senderId } });
                    socket.sendJson({
                        type: 'payment',
                        response: jsonUtils.messageToJson(message, chat, sender)
                    });
                    hub_1.sendNotification(chat, sender.alias, 'message');
                }
            });
        });
        call.on('status', function (status) {
            console.log("Status", status);
            resolve(status);
        });
        call.on('error', function (err) {
            // console.log(err)
            reject(err);
        });
        call.on('end', function () {
            const now = moment().format('YYYY-MM-DD HH:mm:ss').trim();
            console.log(`Closed stream ${now}`);
            // The server has closed the stream.
            reconnectToLND();
        });
        setTimeout(() => {
            resolve(null);
        }, 100);
    }));
}
exports.subscribeInvoices = subscribeInvoices;
var i = 0;
function reconnectToLND() {
    return __awaiter(this, void 0, void 0, function* () {
        i++;
        console.log(`=> [lnd] reconnecting... attempt #${i}`);
        try {
            yield controllers.iniGrpcSubscriptions();
            const now = moment().format('YYYY-MM-DD HH:mm:ss').trim();
            console.log(`=> [lnd] reconnected! ${now}`);
        }
        catch (e) {
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                yield reconnectToLND();
            }), 2000);
        }
    });
}
//# sourceMappingURL=index.js.map