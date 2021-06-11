"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInvoiceRequest = exports.getInfoResponse = void 0;
const config_1 = require("../utils/config");
const config = config_1.loadConfig();
const IS_LND = config.lightning_provider === 'LND';
const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT';
function getInfoResponse(res) {
    if (IS_LND) { // LND
        return res;
    }
    if (IS_GREENLIGHT) { // greenlight
        const r = res;
        return {
            identity_pubkey: Buffer.from(r.node_id).toString('hex'),
            version: r.version,
            alias: r.alias,
            color: r.color,
            num_peers: r.num_peers,
        };
    }
    return {};
}
exports.getInfoResponse = getInfoResponse;
function addInvoiceRequest(req) {
    if (IS_LND)
        return req;
    if (IS_GREENLIGHT) {
        return {
            satoshi: req.value,
            label: req.memo,
            description: req.memo,
        };
    }
    return {};
}
exports.addInvoiceRequest = addInvoiceRequest;
/*
GREENLIGHT NEEDS

route hints in Create Invoice

custom TLV fields Pay (for adding data, and doing keysend payments)


*/ 
//# sourceMappingURL=interfaces.js.map