"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listChannelsRequest = exports.listChannelsCommand = exports.listChannelsResponse = exports.addInvoiceRequest = exports.getInfoResponse = void 0;
const config_1 = require("../utils/config");
const ByteBuffer = require("bytebuffer");
const config = config_1.loadConfig();
const IS_LND = config.lightning_provider === "LND";
const IS_GREENLIGHT = config.lightning_provider === "GREENLIGHT";
function getInfoResponse(res) {
    if (IS_LND) {
        // LND
        return res;
    }
    if (IS_GREENLIGHT) {
        // greenlight
        const r = res;
        return {
            identity_pubkey: Buffer.from(r.node_id).toString("hex"),
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
function listChannelsResponse(res) {
    if (IS_LND)
        return res;
    if (IS_GREENLIGHT) {
        // loop peers?
        const chans = [];
        res.peers.forEach((p) => {
            p.channels.forEach((ch) => {
                chans.push({
                    active: ch.state === 'active',
                    remote_pubkey: Buffer.from(p.id).toString("hex"),
                    channel_point: ch.funding_txid,
                    chan_id: ch.channel_id,
                    capacity: Number(ch.total),
                    local_balance: Number(ch.spendable),
                    remote_balance: Number(ch.receivable),
                });
            });
        });
        return {
            channels: chans,
        };
    }
    return {};
}
exports.listChannelsResponse = listChannelsResponse;
function listChannelsCommand() {
    if (IS_LND)
        return 'listChannels';
    if (IS_GREENLIGHT)
        return 'listPeers';
    return 'listChannels';
}
exports.listChannelsCommand = listChannelsCommand;
function listChannelsRequest(args) {
    const opts = args || {};
    if (args && args.peer) {
        if (IS_LND)
            opts.peer = ByteBuffer.fromHex(args.peer);
        if (IS_GREENLIGHT)
            opts.node_id = ByteBuffer.fromHex(args.peer);
    }
    return opts;
}
exports.listChannelsRequest = listChannelsRequest;
/*
GREENLIGHT NEEDS

route hints in Create Invoice

custom TLV fields Pay (for adding data, and doing keysend payments)

listChannels?
*/
//# sourceMappingURL=interfaces.js.map