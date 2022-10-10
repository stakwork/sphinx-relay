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
exports.subscribeCLN = exports.reconnectToLightning = exports.subscribeInvoices = void 0;
const lightning_1 = require("./lightning");
const network = require("../network");
const unlock_1 = require("../utils/unlock");
const regular_1 = require("./regular");
const interfaces = require("./interfaces");
const proxy_1 = require("../utils/proxy");
const logger_1 = require("../utils/logger");
const config_1 = require("../utils/config");
const helpers_1 = require("../helpers");
const models_1 = require("../models");
const config = (0, config_1.loadConfig)();
const IS_CLN = config.lightning_provider === 'CLN';
const ERR_CODE_UNAVAILABLE = 14;
const ERR_CODE_STREAM_REMOVED = 2;
const ERR_CODE_UNIMPLEMENTED = 12; // locked
function subscribeInvoices(parseKeysendInvoice) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        let ownerPubkey = '';
        if ((0, proxy_1.isProxy)()) {
            ownerPubkey = yield (0, proxy_1.getProxyRootPubkey)();
        }
        const lightning = yield (0, lightning_1.loadLightning)(false, ownerPubkey); // try proxy
        const cmd = interfaces.subscribeCommand();
        if (IS_CLN) {
            return subscribeCLN(cmd, lightning);
        }
        const call = lightning[cmd]();
        call.on('data', function (response) {
            return __awaiter(this, void 0, void 0, function* () {
                // console.log("=> INVOICE RAW", response)
                const inv = interfaces.subscribeResponse(response);
                // console.log("INVOICE RECEIVED", inv)
                // loginvoice(inv)
                if (inv.state !== interfaces.InvoiceState.SETTLED) {
                    return;
                }
                // console.log("IS KEYSEND", inv.is_keysend)
                if (inv.is_keysend) {
                    parseKeysendInvoice(inv);
                }
                else {
                    (0, regular_1.receiveNonKeysend)(inv);
                }
            });
        });
        call.on('status', function (status) {
            logger_1.sphinxLogger.info(`Status ${status.code} ${status}`, logger_1.logging.Lightning);
            // The server is unavailable, trying to reconnect.
            if (status.code == ERR_CODE_UNAVAILABLE ||
                status.code == ERR_CODE_STREAM_REMOVED) {
                i = 0;
                waitAndReconnect();
            }
            else {
                resolve(status);
            }
        });
        call.on('error', function (err) {
            logger_1.sphinxLogger.error(`Error ${err.code}`, logger_1.logging.Lightning);
            if (err.code == ERR_CODE_UNAVAILABLE ||
                err.code == ERR_CODE_STREAM_REMOVED) {
                i = 0;
                waitAndReconnect();
            }
            else {
                reject(err);
            }
        });
        call.on('end', function () {
            logger_1.sphinxLogger.info(`Closed stream`, logger_1.logging.Lightning);
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
    setTimeout(() => reconnectToLightning(Math.random(), null, true), 2000);
}
let i = 0;
let ctx = 0;
function reconnectToLightning(innerCtx, callback, noCache) {
    return __awaiter(this, void 0, void 0, function* () {
        ctx = innerCtx;
        i++;
        logger_1.sphinxLogger.info(`reconnecting... attempt #${i}`, logger_1.logging.Lightning);
        try {
            yield network.initGrpcSubscriptions(true);
            logger_1.sphinxLogger.info(`connected!`, logger_1.logging.Lightning);
            if (callback)
                callback();
        }
        catch (e) {
            if (e.code === ERR_CODE_UNIMPLEMENTED) {
                logger_1.sphinxLogger.error(`LOCKED`, logger_1.logging.Lightning);
                yield (0, unlock_1.tryToUnlockLND)();
            }
            logger_1.sphinxLogger.error(`ERROR ${e}`, logger_1.logging.Lightning);
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                // retry each 2 secs
                if (ctx === innerCtx) {
                    // if another retry fires, then this will not run
                    yield reconnectToLightning(innerCtx, callback, noCache);
                }
            }), 5000);
        }
    });
}
exports.reconnectToLightning = reconnectToLightning;
function subscribeCLN(cmd, lightning) {
    return __awaiter(this, void 0, void 0, function* () {
        let lastpay_index = yield getInvoicesLength(lightning);
        yield models_1.Contact.update({ lastPayIndex: lastpay_index }, { where: { id: 1 } });
        while (true) {
            //   // pull the last invoice, and run "parseKeysendInvoice"
            //   // increment the lastpay_index (+1)
            //   // wait a second and do it again with new lastpay_index
            lightning[cmd]({ lastpay_index }, function (err, response) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (err == null) {
                        if (response.description.includes('keysend')) {
                            const invoice = convertToLndInvoice(response);
                            const owner = (yield models_1.Contact.findOne({
                                where: { id: 1 },
                            }));
                            // If the payindex is greater than that in the db update the db and parse the invoice
                            const payIndex = Number(invoice.settle_index);
                            if (payIndex > owner.lastPayIndex) {
                                yield models_1.Contact.update({ lastPayIndex: payIndex }, { where: { id: 1 } });
                                lastpay_index += 1;
                                const inv = interfaces.subscribeResponse(invoice);
                                console.log('INV ===', inv);
                            }
                        }
                    }
                    else {
                        console.log(err);
                    }
                });
            });
            yield (0, helpers_1.sleep)(1000);
        }
    });
}
exports.subscribeCLN = subscribeCLN;
const convertToLndInvoice = (response) => {
    return {
        memo: response.label,
        r_preimage: response.payment_preimage,
        r_hash: response.payment_hash,
        value: convertMsatToSat(response.amount_received_msat),
        value_msat: response.msatoshi_received,
        settled: response.status === 'PAID' ? true : false,
        creation_date: '',
        settle_date: response.paid_at,
        payment_request: response.bolt11,
        description_hash: Buffer.from(''),
        expiry: response.expires_at,
        fallback_addr: '',
        cltv_expiry: '',
        route_hints: [],
        private: false,
        add_index: '',
        settle_index: response.pay_index,
        amt_paid: convertMsatToSat(response.amount_received_msat),
        amt_paid_sat: convertMsatToSat(response.amount_received_msat),
        amt_paid_msat: response.amount_received_msat.msat,
        state: response.status,
        htlcs: [],
        features: {},
        is_keysend: response.description.includes('keysend')
    };
};
const convertMsatToSat = (value) => {
    return String(Number(value.msat) / 1000);
};
const getInvoicesLength = (lightning) => {
    return new Promise((resolve, reject) => {
        lightning['ListInvoices']({}, function (err, response) {
            if (err === null) {
                resolve(response.invoices.filter(invoice => invoice.status === 'PAID').length);
            }
            reject(1);
        });
    });
};
//# sourceMappingURL=subscribe.js.map