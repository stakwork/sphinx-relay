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
exports.receiveQueryResponse = exports.receiveQuery = exports.queryOnchainAddress = exports.startWatchingUTXOs = exports.getSuggestedSatPerByte = exports.listUTXOs = exports.get_hub_pubkey = void 0;
const res_1 = require("../utils/res");
const models_1 = require("../models");
const network = require("../network");
const constants_1 = require("../constants");
const short = require("short-uuid");
const lightning = require("../grpc/lightning");
const wallet_1 = require("../utils/wallet");
const jsonUtils = require("../utils/json");
const sequelize_1 = require("sequelize");
const node_fetch_1 = require("node-fetch");
const helpers = require("../helpers");
const proxy_1 = require("../utils/proxy");
const logger_1 = require("../utils/logger");
const queries = {};
const POLL_MINS = 10;
let hub_pubkey = '';
const hub_url = 'https://hub.sphinx.chat/api/v1/';
function get_hub_pubkey() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield (0, node_fetch_1.default)(hub_url + '/routingnode');
            const j = yield r.json();
            if (j && j.pubkey) {
                // console.log("=> GOT HUB PUBKEY", j.pubkey)
                hub_pubkey = j.pubkey;
                return j.pubkey;
            }
        }
        catch (e) {
            logger_1.sphinxLogger.warning(`Could not retrive hub routing node pubkey: Error: ${e}`);
        }
        return '';
    });
}
exports.get_hub_pubkey = get_hub_pubkey;
get_hub_pubkey();
function getReceivedAccountings() {
    return __awaiter(this, void 0, void 0, function* () {
        const accountings = yield models_1.models.Accounting.findAll({
            where: {
                status: constants_1.default.statuses.received,
            },
        });
        return accountings.map((a) => a.dataValues || a);
    });
}
function getPendingAccountings() {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('[WATCH] getPendingAccountings')
        const utxos = yield (0, wallet_1.listUnspent)();
        const accountings = yield models_1.models.Accounting.findAll({
            where: {
                onchain_address: {
                    [sequelize_1.Op.in]: utxos.map((utxo) => utxo.address),
                },
                status: constants_1.default.statuses.pending,
            },
        });
        // console.log('[WATCH] gotPendingAccountings', accountings.length, accountings)
        const ret = [];
        accountings.forEach((a) => {
            const utxo = utxos.find((u) => u.address === a.onchainAddress);
            if (utxo) {
                logger_1.sphinxLogger.info(`[WATCH] UTXO ${utxo}`);
                const onchainTxid = utxo.outpoint && utxo.outpoint.txid_str;
                ret.push({
                    id: a.id,
                    pubkey: a.pubkey,
                    onchainAddress: utxo.address,
                    amount: utxo.amount_sat,
                    confirmations: utxo.confirmations,
                    sourceApp: a.sourceApp,
                    date: a.date,
                    onchainTxid: onchainTxid,
                });
            }
        });
        return ret;
    });
}
function listUTXOs(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ret = yield getPendingAccountings();
            (0, res_1.success)(res, ret.map((acc) => jsonUtils.accountingToJson(acc)));
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.listUTXOs = listUTXOs;
function getSuggestedSatPerByte() {
    return __awaiter(this, void 0, void 0, function* () {
        const MAX_AMT = 250;
        try {
            const r = yield (0, node_fetch_1.default)('https://mempool.space/api/v1/fees/recommended');
            const j = yield r.json();
            return Math.min(MAX_AMT, j.halfHourFee);
        }
        catch (e) {
            return MAX_AMT;
        }
    });
}
exports.getSuggestedSatPerByte = getSuggestedSatPerByte;
// https://mempool.space/api/v1/fees/recommended
function genChannelAndConfirmAccounting(acc) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info(`[WATCH]=> genChannelAndConfirmAccounting`);
        const sat_per_byte = yield getSuggestedSatPerByte();
        logger_1.sphinxLogger.info(`[WATCH]=> sat_per_byte ${sat_per_byte}`);
        try {
            const r = yield lightning.openChannel({
                node_pubkey: acc.pubkey,
                local_funding_amount: acc.amount,
                push_sat: 0,
                sat_per_byte,
            });
            logger_1.sphinxLogger.info(`[WATCH]=> CHANNEL OPENED! ${r}`);
            const fundingTxidRev = Buffer.from(r.funding_txid_bytes).toString('hex');
            const fundingTxid = fundingTxidRev.match(/.{2}/g)
                .reverse()
                .join('');
            yield models_1.models.Accounting.update({
                status: constants_1.default.statuses.received,
                fundingTxid: fundingTxid,
                onchainTxid: acc.onchainTxid,
                amount: acc.amount,
            }, {
                where: { id: acc.id },
            });
            logger_1.sphinxLogger.info(`[WATCH]=> ACCOUNTINGS UPDATED to received! ${acc.id}`);
        }
        catch (e) {
            logger_1.sphinxLogger.error(`[ACCOUNTING] error creating channel ${e}`);
            const existing = yield models_1.models.Accounting.findOne({ where: { id: acc.id } });
            if (existing) {
                if (!existing.amount) {
                    yield existing.update({ amount: acc.amount });
                }
            }
        }
    });
}
function pollUTXOs() {
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, proxy_1.isProxy)())
            return; // not on proxy for now???
        // console.log("[WATCH]=> pollUTXOs")
        const accs = yield getPendingAccountings();
        if (!accs)
            return;
        // console.log("[WATCH]=> accs", accs.length)
        yield asyncForEach(accs, (acc) => __awaiter(this, void 0, void 0, function* () {
            if (acc.confirmations <= 0)
                return; // needs confs
            if (acc.amount <= 0)
                return; // needs amount
            if (!acc.pubkey)
                return; // this shouldnt happen
            yield genChannelAndConfirmAccounting(acc);
        }));
        yield checkForConfirmedChannels();
    });
}
function checkForConfirmedChannels() {
    return __awaiter(this, void 0, void 0, function* () {
        const received = yield getReceivedAccountings();
        // console.log('[WATCH] received accountings:', received)
        yield asyncForEach(received, (rec) => __awaiter(this, void 0, void 0, function* () {
            if (rec.amount <= 0)
                return; // needs amount
            if (!rec.pubkey)
                return; // this shouldnt happen
            if (!rec.fundingTxid)
                return;
            yield checkChannelsAndKeysend(rec);
        }));
    });
}
function checkChannelsAndKeysend(rec) {
    return __awaiter(this, void 0, void 0, function* () {
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const chans = yield lightning.listChannels({
            active_only: true,
            peer: rec.pubkey,
        });
        logger_1.sphinxLogger.info(`[WATCH] chans for pubkey: ${rec.pubkey} ${chans}`);
        if (!(chans && chans.channels))
            return;
        chans.channels.forEach((chan) => {
            // find by txid
            if (chan.channel_point.includes(rec.fundingTxid)) {
                logger_1.sphinxLogger.info(`[WATCH] found channel to keysend! ${chan}`);
                const msg = {
                    type: constants_1.default.message_types.keysend,
                };
                const extraAmount = 2000;
                const localReserve = parseInt(chan.local_chan_reserve_sat) || 0;
                const remoteReserve = parseInt(chan.remote_chan_reserve_sat) || 0;
                const commitFee = parseInt(chan.commit_fee) || 0;
                const amount = rec.amount - localReserve - remoteReserve - commitFee - extraAmount;
                logger_1.sphinxLogger.info(`[WATCH] amt to final keysend ${amount}`);
                helpers.performKeysendMessage({
                    sender: owner,
                    destination_key: rec.pubkey,
                    route_hint: rec.routeHint,
                    amount,
                    msg,
                    success: function () {
                        logger_1.sphinxLogger.info(`[WATCH] complete! Updating accounting, id: ${rec.id}`);
                        models_1.models.Accounting.update({
                            status: constants_1.default.statuses.confirmed,
                            chanId: chan.chan_id,
                            extraAmount,
                            localReserve,
                            remoteReserve,
                            commitFee,
                        }, {
                            where: { id: rec.id },
                        });
                    },
                    failure: function () {
                        logger_1.sphinxLogger.error(`[WATCH] failed final keysend`);
                    },
                });
            }
        });
    });
}
function startWatchingUTXOs() {
    setInterval(pollUTXOs, POLL_MINS * 60 * 1000); // every 1 minutes
}
exports.startWatchingUTXOs = startWatchingUTXOs;
function queryOnchainAddress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        // const tenant:number = req.owner.id
        logger_1.sphinxLogger.info(`=> queryOnchainAddress`);
        if (!hub_pubkey)
            return logger_1.sphinxLogger.error(`=> NO ROUTING NODE PUBKEY SET`);
        const uuid = short.generate();
        const owner = req.owner;
        const app = req.params.app;
        const query = {
            type: 'onchain_address',
            uuid,
            app,
        };
        const opts = {
            amt: constants_1.default.min_sat_amount,
            dest: hub_pubkey,
            data: {
                type: constants_1.default.message_types.query,
                message: {
                    content: JSON.stringify(query),
                },
                sender: Object.assign({ pub_key: owner.publicKey }, (owner.routeHint && { route_hint: owner.routeHint })),
            },
        };
        try {
            yield network.signAndSend(opts, owner);
        }
        catch (e) {
            (0, res_1.failure)(res, e);
            return;
        }
        let i = 0;
        const interval = setInterval(() => {
            if (i >= 15) {
                clearInterval(interval);
                delete queries[uuid];
                (0, res_1.failure)(res, 'no response received');
                return;
            }
            if (queries[uuid]) {
                (0, res_1.success)(res, queries[uuid].result);
                clearInterval(interval);
                delete queries[uuid];
                return;
            }
            i++;
        }, 1000);
    });
}
exports.queryOnchainAddress = queryOnchainAddress;
const receiveQuery = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const dat = payload;
    const sender_pub_key = dat.sender.pub_key;
    const content = dat.message.content;
    const owner = dat.owner;
    const sender_route_hint = dat.sender.route_hint;
    // const tenant:number = owner.id
    if (!sender_pub_key || !content || !owner) {
        return logger_1.sphinxLogger.error(`=> wrong query format`);
    }
    let q;
    try {
        q = JSON.parse(content);
    }
    catch (e) {
        logger_1.sphinxLogger.error(`=> ERROR receiveQuery, ${e}`);
        return;
    }
    logger_1.sphinxLogger.info(`=> query received ${q}`);
    let result = '';
    switch (q.type) {
        case 'onchain_address': {
            const addy = yield lightning.newAddress(lightning.NESTED_PUBKEY_HASH);
            const acc = {
                date: new Date(),
                pubkey: sender_pub_key,
                onchainAddress: addy,
                amount: 0,
                sourceApp: q.app,
                status: constants_1.default.statuses.pending,
                error: '',
                routeHint: sender_route_hint,
            };
            yield models_1.models.Accounting.create(acc);
            result = addy;
        }
    }
    const ret = {
        type: q.type,
        uuid: q.uuid,
        app: q.app,
        result,
    };
    const opts = {
        amt: constants_1.default.min_sat_amount,
        dest: sender_pub_key,
        route_hint: sender_route_hint,
        data: {
            type: constants_1.default.message_types.query_response,
            message: {
                content: JSON.stringify(ret),
            },
            sender: { pub_key: owner.publicKey },
        },
    };
    try {
        yield network.signAndSend(opts, owner);
    }
    catch (e) {
        logger_1.sphinxLogger.error(`FAILED TO SEND QUERY_RESPONSE`);
        return;
    }
});
exports.receiveQuery = receiveQuery;
const receiveQueryResponse = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.sphinxLogger.info(`=> receiveQueryResponse`, logger_1.logging.Network);
    const dat = payload;
    // const sender_pub_key = dat.sender.pub_key
    const content = dat.message.content;
    try {
        const q = JSON.parse(content);
        queries[q.uuid] = q;
    }
    catch (e) {
        logger_1.sphinxLogger.error(`=> ERROR receiveQueryResponse, ${e}`);
    }
});
exports.receiveQueryResponse = receiveQueryResponse;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=queries.js.map