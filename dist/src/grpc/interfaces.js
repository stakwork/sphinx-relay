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
        console.log(JSON.stringify(res));
        const chans = [];
        res.peers.forEach((p) => {
            p.channels.forEach((ch, i) => {
                chans.push({
                    active: ch.state === GreenlightChannelState.CHANNELD_NORMAL,
                    remote_pubkey: Buffer.from(p.id).toString("hex"),
                    channel_point: ch.funding_txid = ':' + i,
                    chan_id: ch.channel_id,
                    capacity: greelightNumber(ch.total),
                    local_balance: greelightNumber(ch.spendable),
                    remote_balance: greelightNumber(ch.receivable),
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
            opts.node_id = args.peer;
    }
    return opts;
}
exports.listChannelsRequest = listChannelsRequest;
function greelightNumber(s) {
    console.log(s);
    if (s.endsWith('msat')) {
        const s1 = s.substr(0, s.length - 4);
        return Math.floor(parseInt(s1) / 1000);
    }
    if (s.endsWith('sat')) {
        const s1 = s.substr(0, s.length - 3);
        return parseInt(s1);
    }
    return 0;
}
var GreenlightChannelState;
(function (GreenlightChannelState) {
    GreenlightChannelState["CHANNELD_AWAITING_LOCKIN"] = "CHANNELD_AWAITING_LOCKIN";
    /* Normal operating state. */
    GreenlightChannelState["CHANNELD_NORMAL"] = "CHANNELD_NORMAL";
    /* We are closing, pending HTLC resolution. */
    GreenlightChannelState["CHANNELD_SHUTTING_DOWN"] = "CHANNELD_SHUTTING_DOWN";
    /* Exchanging signatures on closing tx. */
    GreenlightChannelState["CLOSINGD_SIGEXCHANGE"] = "CLOSINGD_SIGEXCHANGE";
    /* Waiting for onchain event. */
    GreenlightChannelState["CLOSINGD_COMPLETE"] = "CLOSINGD_COMPLETE";
    /* Waiting for unilateral close to hit blockchain. */
    GreenlightChannelState["AWAITING_UNILATERAL"] = "AWAITING_UNILATERAL";
    /* We've seen the funding spent, we're waiting for onchaind. */
    GreenlightChannelState["FUNDING_SPEND_SEEN"] = "FUNDING_SPEND_SEEN";
    /* On chain */
    GreenlightChannelState["ONCHAIN"] = "ONCHAIN";
    /* Final state after we have fully settled on-chain */
    GreenlightChannelState["CLOSED"] = "CLOSED";
    /* For dual-funded channels, we start at a different state.
     * We transition to 'awaiting lockin' after sigs have
     * been exchanged */
    GreenlightChannelState["DUALOPEND_OPEN_INIT"] = "DUALOPEND_OPEN_INIT";
    /* Dual-funded channel, waiting for lock-in */
    GreenlightChannelState["DUALOPEND_AWAITING_LOCKIN"] = "DUALOPEND_AWAITING_LOCKIN";
})(GreenlightChannelState || (GreenlightChannelState = {}));
;
/*
GREENLIGHT NEEDS

route hints in Create Invoice

custom TLV fields Pay (for adding data, and doing keysend payments)

listChannels?
*/
//# sourceMappingURL=interfaces.js.map