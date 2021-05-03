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
exports.reconnectToLND = exports.subscribeInvoices = void 0;
const models_1 = require("../models");
const socket = require("../utils/socket");
const hub_1 = require("../hub");
const jsonUtils = require("../utils/json");
const decodeUtils = require("../utils/decode");
const lightning_1 = require("../utils/lightning");
const network = require("../network");
const moment = require("moment");
const constants_1 = require("../constants");
const unlock_1 = require("../utils/unlock");
const ERR_CODE_UNAVAILABLE = 14;
const ERR_CODE_STREAM_REMOVED = 2;
const ERR_CODE_UNIMPLEMENTED = 12; // locked
const oktolog = false;
function loginvoice(r) {
    if (!oktolog)
        return;
    r.r_hash = '';
    r.r_preimage = '';
    r.htlcs = [];
    console.log("AN INVOICE WAS RECIEVED!!!=======================>", JSON.stringify(r, null, 2));
}
function subscribeInvoices(parseKeysendInvoice) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const lightning = yield lightning_1.loadLightning(true); // try proxy
        var call = lightning.subscribeInvoices();
        call.on('data', function (response) {
            return __awaiter(this, void 0, void 0, function* () {
                loginvoice(response);
                if (response['state'] !== 'SETTLED') {
                    return;
                }
                // console.log("IS KEYSEND", response.is_keysend)
                if (response.is_keysend) {
                    parseKeysendInvoice(response);
                }
                else {
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
                    const invoice = yield models_1.models.Message.findOne({ where: { type: constants_1.default.message_types.invoice, payment_request: response['payment_request'] } });
                    if (invoice == null) {
                        const invoice = yield lightning_1.decodePayReq(response['payment_request']);
                        if (!invoice)
                            return console.log("subscribeInvoices: couldn't decode pay req");
                        if (!invoice.destination)
                            return console.log("subscribeInvoices: cant get dest from pay req");
                        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true, publicKey: invoice.destination } });
                        if (!owner)
                            return console.log('subscribeInvoices: no owner found');
                        const tenant = owner.id;
                        const payReq = response['payment_request'];
                        const amount = response['amt_paid_sat'];
                        if (process.env.HOSTING_PROVIDER === 'true') {
                            hub_1.sendInvoice(payReq, amount);
                        }
                        socket.sendJson({
                            type: 'invoice_payment',
                            response: { invoice: payReq }
                        }, tenant);
                        yield models_1.models.Message.create({
                            chatId: 0,
                            type: constants_1.default.message_types.payment,
                            sender: 0,
                            amount: response['amt_paid_sat'],
                            amountMsat: response['amt_paid_msat'],
                            paymentHash: paymentHash,
                            date: new Date(settleDate),
                            messageContent: response['memo'],
                            status: constants_1.default.statuses.confirmed,
                            createdAt: new Date(settleDate),
                            updatedAt: new Date(settleDate),
                            network_type: constants_1.default.network_types.lightning,
                            tenant,
                        });
                        return;
                    }
                    // invoice is defined
                    const tenant = invoice.tenant;
                    const owner = yield models_1.models.Contact.findOne({ where: { id: tenant } });
                    models_1.models.Message.update({ status: constants_1.default.statuses.confirmed }, { where: { id: invoice.id } });
                    const chat = yield models_1.models.Chat.findOne({ where: { id: invoice.chatId, tenant } });
                    const contactIds = JSON.parse(chat.contactIds);
                    const senderId = contactIds.find(id => id != invoice.sender);
                    const message = yield models_1.models.Message.create({
                        chatId: invoice.chatId,
                        type: constants_1.default.message_types.payment,
                        sender: senderId,
                        amount: response['amt_paid_sat'],
                        amountMsat: response['amt_paid_msat'],
                        paymentHash: paymentHash,
                        date: new Date(settleDate),
                        messageContent: response['memo'],
                        status: constants_1.default.statuses.confirmed,
                        createdAt: new Date(settleDate),
                        updatedAt: new Date(settleDate),
                        network_type: constants_1.default.network_types.lightning,
                        tenant,
                    });
                    const sender = yield models_1.models.Contact.findOne({ where: { id: senderId, tenant } });
                    socket.sendJson({
                        type: 'payment',
                        response: jsonUtils.messageToJson(message, chat, sender)
                    }, tenant);
                    hub_1.sendNotification(chat, sender.alias, 'message', owner);
                }
            });
        });
        call.on('status', function (status) {
            console.log("Status", status.code, status);
            // The server is unavailable, trying to reconnect.
            if (status.code == ERR_CODE_UNAVAILABLE || status.code == ERR_CODE_STREAM_REMOVED) {
                i = 0;
                waitAndReconnect();
            }
            else {
                resolve(status);
            }
        });
        call.on('error', function (err) {
            const now = moment().format('YYYY-MM-DD HH:mm:ss').trim();
            console.error('[LND] Error', now, err.code);
            if (err.code == ERR_CODE_UNAVAILABLE || err.code == ERR_CODE_STREAM_REMOVED) {
                i = 0;
                waitAndReconnect();
            }
            else {
                reject(err);
            }
        });
        call.on('end', function () {
            const now = moment().format('YYYY-MM-DD HH:mm:ss').trim();
            console.log(`Closed stream ${now}`);
            // The server has closed the stream.
            i = 0;
            waitAndReconnect();
        });
        setTimeout(() => {
            resolve(null);
        }, 100);
    }));
}
exports.subscribeInvoices = subscribeInvoices;
function waitAndReconnect() {
    setTimeout(() => reconnectToLND(Math.random()), 2000);
}
var i = 0;
var ctx = 0;
function reconnectToLND(innerCtx, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        ctx = innerCtx;
        i++;
        const now = moment().format('YYYY-MM-DD HH:mm:ss').trim();
        console.log(`=> ${now} [lnd] reconnecting... attempt #${i}`);
        try {
            yield network.initGrpcSubscriptions();
            const now = moment().format('YYYY-MM-DD HH:mm:ss').trim();
            console.log(`=> [lnd] connected! ${now}`);
            if (callback)
                callback();
        }
        catch (e) {
            if (e.code === ERR_CODE_UNIMPLEMENTED) {
                yield unlock_1.tryToUnlockLND();
            }
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                if (ctx === innerCtx) { // if another retry fires, then this will not run
                    yield reconnectToLND(innerCtx, callback);
                }
            }), 2000);
        }
    });
}
exports.reconnectToLND = reconnectToLND;
//# sourceMappingURL=index.js.map