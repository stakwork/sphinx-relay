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
const moment = require("moment");
const unlock_1 = require("../utils/unlock");
const regular_1 = require("./regular");
const interfaces = require("./interfaces");
const ERR_CODE_UNAVAILABLE = 14;
const ERR_CODE_STREAM_REMOVED = 2;
const ERR_CODE_UNIMPLEMENTED = 12; // locked
function subscribeInvoices(parseKeysendInvoice) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const lightning = yield lightning_1.loadLightning(true); // try proxy
        const cmd = interfaces.subscribeCommand();
        var call = lightning[cmd]();
        call.on('data', function (response) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log("=> INVOICE RAW", response);
                const inv = interfaces.subscribeResponse(response);
                console.log("INVOICE RECEIVED", inv);
                // loginvoice(inv)
                if (inv.state !== interfaces.InvoiceState.SETTLED) {
                    return;
                }
                // console.log("IS KEYSEND", inv.is_keysend)
                if (inv.is_keysend) {
                    parseKeysendInvoice(inv);
                }
                else {
                    regular_1.receiveNonKeysend(inv);
                }
            });
        });
        call.on('status', function (status) {
            console.log("[lightning] Status", status.code, status);
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
            console.error('[lightning] Error', now, err.code);
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
            console.log(`[lightning] Closed stream ${now}`);
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
    setTimeout(() => reconnectToLightning(Math.random()), 2000);
}
var i = 0;
var ctx = 0;
function reconnectToLightning(innerCtx, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        ctx = innerCtx;
        i++;
        const now = moment().format('YYYY-MM-DD HH:mm:ss').trim();
        console.log(`=> ${now} [lightning] reconnecting... attempt #${i}`);
        try {
            yield network.initGrpcSubscriptions();
            const now = moment().format('YYYY-MM-DD HH:mm:ss').trim();
            console.log(`=> [lightning] connected! ${now}`);
            if (callback)
                callback();
        }
        catch (e) {
            if (e.code === ERR_CODE_UNIMPLEMENTED) {
                yield unlock_1.tryToUnlockLND();
            }
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                if (ctx === innerCtx) { // if another retry fires, then this will not run
                    yield reconnectToLightning(innerCtx, callback);
                }
            }), 2000);
        }
    });
}
exports.reconnectToLightning = reconnectToLightning;
//# sourceMappingURL=subscribe.js.map