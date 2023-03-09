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
exports.reconnectToLightning = exports.subscribeInvoices = void 0;
const lightning_1 = require("./lightning");
const network = require("../network");
const unlock_1 = require("../utils/unlock");
const regular_1 = require("./regular");
const interfaces = require("./interfaces");
const proxy_1 = require("../utils/proxy");
const logger_1 = require("../utils/logger");
const ERR_CODE_UNAVAILABLE = 14;
const ERR_CODE_STREAM_REMOVED = 2;
const ERR_CODE_UNIMPLEMENTED = 12; // locked
function subscribeInvoices(parseKeysendInvoice) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        let ownerPubkey = '';
        if ((0, proxy_1.isProxy)()) {
            ownerPubkey = yield (0, proxy_1.getProxyRootPubkey)();
        }
        const lightning = yield (0, lightning_1.loadLightning)(true, ownerPubkey); // try proxy
        const cmd = interfaces.subscribeCommand();
        const call = lightning[cmd]({});
        call.on('data', function (response) {
            return __awaiter(this, void 0, void 0, function* () {
                // console.log('=> INVOICE RAW', response)
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
//# sourceMappingURL=subscribe.js.map