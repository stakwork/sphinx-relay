"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.greenlightSignMessagePayload = exports.connectPeerResponse = exports.connectPeerRequest = exports.subscribeResponse = exports.InvoiceState = exports.subscribeCommand = exports.keysendResponse = exports.keysendRequest = exports.listPeersResponse = exports.listPeersRequest = exports.listChannelsRequest = exports.listChannelsCommand = exports.listChannelsResponse = exports.addInvoiceResponse = exports.addInvoiceCommand = exports.addInvoiceRequest = exports.getInfoResponse = void 0;
const config_1 = require("../utils/config");
const ByteBuffer = require("bytebuffer");
const crypto = require("crypto");
const lightning_1 = require("./lightning");
const long = require("long");
const config = (0, config_1.loadConfig)();
const IS_LND = config.lightning_provider === 'LND';
const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT';
function getInfoResponse(res) {
    if (IS_LND) {
        // LND
        return res;
    }
    if (IS_GREENLIGHT) {
        // greenlight
        const r = res;
        return {
            identity_pubkey: Buffer.from(r.node_id).toString('hex'),
            version: r.version,
            alias: r.alias,
            color: r.color,
            num_peers: r.num_peers,
            // FAKE VALUES
            num_active_channels: 0,
            num_pending_channels: 0,
            synced_to_chain: true,
            synced_to_graph: true,
            best_header_timestamp: 0,
            testnet: false,
        };
    }
    return {};
}
exports.getInfoResponse = getInfoResponse;
function makeLabel() {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
}
function addInvoiceRequest(req) {
    if (IS_LND)
        return req;
    if (IS_GREENLIGHT) {
        return {
            amount: { unit: 'satoshi', satoshi: req.value + '' },
            label: makeLabel(),
            description: req.memo,
        };
    }
    return {};
}
exports.addInvoiceRequest = addInvoiceRequest;
var GreenlightInvoiceStatus;
(function (GreenlightInvoiceStatus) {
    GreenlightInvoiceStatus[GreenlightInvoiceStatus["UNPAID"] = 0] = "UNPAID";
    GreenlightInvoiceStatus[GreenlightInvoiceStatus["PAID"] = 1] = "PAID";
    GreenlightInvoiceStatus[GreenlightInvoiceStatus["EXPIRED"] = 2] = "EXPIRED";
})(GreenlightInvoiceStatus || (GreenlightInvoiceStatus = {}));
function addInvoiceCommand() {
    if (IS_LND)
        return 'addInvoice';
    if (IS_GREENLIGHT)
        return 'createInvoice';
    return 'addInvoice';
}
exports.addInvoiceCommand = addInvoiceCommand;
function addInvoiceResponse(res) {
    if (IS_LND)
        return res;
    if (IS_GREENLIGHT) {
        const r = res;
        return {
            payment_request: r.bolt11,
            r_hash: r.payment_hash,
            add_index: 0,
        };
    }
    return {};
}
exports.addInvoiceResponse = addInvoiceResponse;
function listChannelsResponse(res) {
    if (IS_LND)
        return res;
    if (IS_GREENLIGHT) {
        const chans = [];
        res.peers.forEach((p) => {
            p.channels.forEach((ch, i) => {
                chans.push({
                    active: ch.state === GreenlightChannelState.CHANNELD_NORMAL,
                    remote_pubkey: Buffer.from(p.id).toString('hex'),
                    channel_point: ch.funding_txid + ':' + i,
                    chan_id: shortChanIDtoInt64(ch.channel_id),
                    capacity: greelightNumber(ch.total) + '',
                    local_balance: greelightNumber(ch.spendable) + '',
                    remote_balance: greelightNumber(ch.receivable) + '',
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
function listPeersRequest(args) {
    const opts = args || {};
    if (IS_GREENLIGHT && args && args.node_id) {
        opts.node_id = ByteBuffer.fromHex(args.node_id);
    }
    return opts;
}
exports.listPeersRequest = listPeersRequest;
function listPeersResponse(res) {
    if (IS_LND)
        return res;
    if (IS_GREENLIGHT) {
        return {
            peers: res.peers.map((p) => {
                const addy = p.addresses[0];
                const peer = {
                    pub_key: Buffer.from(p.id).toString('hex'),
                    address: addy
                        ? addy.port
                            ? `${addy.addr}:${addy.port}`
                            : addy.addr
                        : '',
                };
                return peer;
            }),
        };
    }
    return {};
}
exports.listPeersResponse = listPeersResponse;
function keysendRequest(req) {
    if (IS_LND)
        return req;
    if (IS_GREENLIGHT) {
        const r = {
            node_id: req.dest,
            amount: { unit: 'satoshi', satoshi: req.amt + '' },
            label: makeLabel(),
        };
        if (req.route_hints) {
            r.routehints = req.route_hints.map((rh) => {
                const hops = rh.hop_hints.map((hh) => {
                    return {
                        node_id: ByteBuffer.fromHex(hh.node_id),
                        short_channel_id: shortChanIDfromInt64(hh.chan_id),
                        fee_base: '1000',
                        fee_prop: 1,
                        cltv_expiry_delta: 40,
                    };
                });
                return hops;
            });
        }
        if (req.dest_custom_records) {
            const dest_recs = [];
            Object.entries(req.dest_custom_records).forEach(([type, value]) => {
                if (type === `${lightning_1.LND_KEYSEND_KEY}`)
                    return;
                dest_recs.push({ type, value });
            });
            r.extratlvs = dest_recs;
        }
        return r;
    }
    return {};
}
exports.keysendRequest = keysendRequest;
var GreenlightPaymentStatus;
(function (GreenlightPaymentStatus) {
    GreenlightPaymentStatus[GreenlightPaymentStatus["PENDING"] = 0] = "PENDING";
    GreenlightPaymentStatus[GreenlightPaymentStatus["COMPLETE"] = 1] = "COMPLETE";
    GreenlightPaymentStatus[GreenlightPaymentStatus["FAILED"] = 2] = "FAILED";
})(GreenlightPaymentStatus || (GreenlightPaymentStatus = {}));
function keysendResponse(res) {
    if (IS_LND)
        return res;
    if (IS_GREENLIGHT) {
        const r = res;
        const route = {};
        const { satoshi, millisatoshi } = greenlightAmoutToAmounts(r.amount);
        route.total_amt = satoshi;
        route.total_amt_msat = millisatoshi;
        return {
            payment_error: r.status === GreenlightPaymentStatus.FAILED ? 'payment failed' : '',
            payment_preimage: r.payment_preimage,
            payment_hash: r.payment_hash,
            payment_route: route,
        };
    }
    return {};
}
exports.keysendResponse = keysendResponse;
function subscribeCommand() {
    if (IS_LND)
        return 'subscribeInvoices';
    if (IS_GREENLIGHT)
        return 'streamIncoming';
    return 'subscribeInvoices';
}
exports.subscribeCommand = subscribeCommand;
var InvoiceState;
(function (InvoiceState) {
    InvoiceState["OPEN"] = "OPEN";
    InvoiceState["SETTLED"] = "SETTLED";
    InvoiceState["CANCELED"] = "CANCELED";
    InvoiceState["ACCEPTED"] = "ACCEPTED";
})(InvoiceState = exports.InvoiceState || (exports.InvoiceState = {}));
var InvoiceHTLCState;
(function (InvoiceHTLCState) {
    InvoiceHTLCState[InvoiceHTLCState["ACCEPTED"] = 0] = "ACCEPTED";
    InvoiceHTLCState[InvoiceHTLCState["SETTLED"] = 1] = "SETTLED";
    InvoiceHTLCState[InvoiceHTLCState["CANCELED"] = 2] = "CANCELED";
})(InvoiceHTLCState || (InvoiceHTLCState = {}));
function subscribeResponse(res) {
    if (IS_LND)
        return res;
    if (IS_GREENLIGHT) {
        const r1 = res;
        if (!r1.offchain)
            return {};
        const r = r1.offchain;
        const custom_records = {};
        let is_keysend = false;
        if (r.extratlvs) {
            r.extratlvs.forEach((tlv) => {
                // console.log("TLV TYPE", tlv.type, typeof tlv.type, `${LND_KEYSEND_KEY}`)
                // if(tlv.type===`${LND_KEYSEND_KEY}`) is_keysend=true
                custom_records[tlv.type] = tlv.value;
            });
        }
        if (r.label.startsWith('keysend'))
            is_keysend = true;
        const i = {
            memo: r.label,
            r_preimage: r.preimage,
            is_keysend,
            htlcs: [{ custom_records }],
            state: InvoiceState.SETTLED,
            r_hash: r.payment_hash,
            payment_request: r.bolt11,
        };
        const { satoshi, millisatoshi } = greenlightAmoutToAmounts(r.amount);
        i.value = satoshi;
        i.value_msat = millisatoshi;
        i.amt_paid_sat = satoshi;
        i.amt_paid_msat = millisatoshi;
        return i;
    }
    return {};
}
exports.subscribeResponse = subscribeResponse;
function connectPeerRequest(req) {
    if (IS_LND)
        return req;
    if (IS_GREENLIGHT) {
        return {
            node_id: req.addr.pubkey,
            addr: req.addr.host,
        };
    }
    return {};
}
exports.connectPeerRequest = connectPeerRequest;
function connectPeerResponse(res) {
    if (IS_LND)
        return res;
    if (IS_GREENLIGHT) {
        return {};
    }
    return {};
}
exports.connectPeerResponse = connectPeerResponse;
function greenlightAmoutToAmounts(a) {
    let satoshi = '';
    let millisatoshi = '';
    if (a.unit === 'satoshi') {
        satoshi = a.satoshi || '0';
        millisatoshi = parseInt(a.satoshi || '0') * 1000 + '';
    }
    else if (a.unit === 'millisatoshi') {
        satoshi = Math.floor(parseInt(a.millisatoshi || '0') / 1000) + '';
        millisatoshi = a.millisatoshi + '';
    }
    return { satoshi, millisatoshi };
}
function greelightNumber(s) {
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
function greenlightSignMessagePayload(msg) {
    const type = 23;
    const length = msg.length;
    const typebuf = Buffer.allocUnsafe(2);
    typebuf.writeUInt16BE(type, 0);
    const lengthbuf = Buffer.allocUnsafe(2);
    lengthbuf.writeUInt16BE(length, 0);
    const buf = Buffer.concat([typebuf, lengthbuf, msg], 4 + length);
    return buf.toString('hex');
}
exports.greenlightSignMessagePayload = greenlightSignMessagePayload;
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
function shortChanIDfromInt64(int) {
    if (typeof int !== 'string')
        return '';
    const l = long.fromString(int, true);
    const blockHeight = l.shiftRight(40);
    const txIndex = l.shiftRight(16).and(0xffffff);
    const txPosition = l.and(0xffff);
    if (IS_GREENLIGHT) {
        return `${blockHeight.toString()}x${txIndex.toString()}x${txPosition.toString()}`;
    }
    return `${blockHeight.toString()}:${txIndex.toString()}:${txPosition.toString()}`;
}
function shortChanIDtoInt64(cid) {
    if (typeof cid !== 'string')
        return '';
    if (!(cid.includes(':') || cid.includes('x')))
        return '';
    let a = [];
    const seps = [':', 'x'];
    for (const sep of seps) {
        if (cid.includes(sep))
            a = cid.split(sep);
    }
    if (!a)
        return '';
    if (!Array.isArray(a))
        return '';
    if (!(a.length === 3))
        return '';
    const blockHeight = long.fromString(a[0], true).shiftLeft(40);
    const txIndex = long.fromString(a[1], true).shiftLeft(16);
    const txPosition = long.fromString(a[2], true);
    return blockHeight.or(txIndex).or(txPosition).toString();
}
//# sourceMappingURL=interfaces.js.map