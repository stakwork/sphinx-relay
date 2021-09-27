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
exports.saveLsat = void 0;
const lsat_js_1 = require("lsat-js");
const crypto_1 = require("crypto");
const bolt11_1 = require("@boltz/bolt11");
const Macaroon = require("macaroon");
const helpers_1 = require("../../utils/helpers");
const createNewInvoice_1 = require("../../utils/createNewInvoice");
const macaroonSigningKey = crypto_1.randomBytes(32).toString('hex');
const macaroonFromInvoice = (t, payreq) => {
    var _a;
    const invoice = bolt11_1.decode(payreq);
    const paymentHash = ((_a = invoice.tags
        .find((tag) => tag.tagName === 'payment_hash')) === null || _a === void 0 ? void 0 : _a.data.toString()) || '';
    t.truthy(paymentHash, 'expected a payment hash in the payment request');
    const mac = Macaroon.newMacaroon({
        version: 1,
        rootKey: macaroonSigningKey,
        identifier: new lsat_js_1.Identifier({
            paymentHash: Buffer.from(paymentHash, 'hex'),
        }).toString(),
        location: 'tests',
    });
    return lsat_js_1.getRawMacaroon(mac);
};
const saveLsat = (t, payer, receiver) => __awaiter(void 0, void 0, void 0, function* () {
    const { invoice } = yield createNewInvoice_1.createNewInvoice(t, receiver, 500);
    const macaroon = macaroonFromInvoice(t, invoice);
    const args = {
        paymentRequest: invoice,
        macaroon,
        issuer: receiver.ip,
    };
    const { lsat: token } = yield helpers_1.makeRelayRequest('post', '/lsats', payer, args);
    t.assert(token.length, 'expected an lsat token in response');
    return token;
});
exports.saveLsat = saveLsat;
//# sourceMappingURL=saveLsat.js.map