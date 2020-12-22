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
const res_1 = require("../utils/res");
const models_1 = require("../models");
const network = require("../network");
const constants_1 = require("../constants");
const short = require("short-uuid");
const lightning = require("../utils/lightning");
const wallet_1 = require("../utils/wallet");
const jsonUtils = require("../utils/json");
const sequelize_1 = require("sequelize");
const node_fetch_1 = require("node-fetch");
const helpers = require("../helpers");
let queries = {};
// const hub_pubkey = '023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f'
const hub_pubkey = '02290714deafd0cb33d2be3b634fc977a98a9c9fa1dd6c53cf17d99b350c08c67b';
function getReceivedAccountings() {
    return __awaiter(this, void 0, void 0, function* () {
        const accountings = yield models_1.models.Accounting.findAll({
            where: {
                status: constants_1.default.statuses.received
            }
        });
        return accountings.map(a => (a.dataValues || a));
    });
}
function getPendingAccountings() {
    return __awaiter(this, void 0, void 0, function* () {
        const utxos = yield wallet_1.listUnspent();
        const accountings = yield models_1.models.Accounting.findAll({
            where: {
                onchain_address: {
                    [sequelize_1.Op.in]: utxos.map(utxo => utxo.address)
                },
                status: constants_1.default.statuses.pending
            }
        });
        const ret = [];
        accountings.forEach(a => {
            const utxo = utxos.find(u => u.address === a.onchainAddress);
            if (utxo) {
                ret.push({
                    id: a.id,
                    pubkey: a.pubkey,
                    onchainAddress: utxo.address,
                    amount: utxo.amount_sat,
                    confirmations: utxo.confirmations,
                    sourceApp: a.sourceApp,
                    date: a.date,
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
            res_1.success(res, ret.map(acc => jsonUtils.accountingToJson(acc)));
        }
        catch (e) {
            res_1.failure(res, e);
        }
    });
}
exports.listUTXOs = listUTXOs;
function getSuggestedSatPerByte() {
    return __awaiter(this, void 0, void 0, function* () {
        const MAX_AMT = 250;
        try {
            const r = yield node_fetch_1.default('https://mempool.space/api/v1/fees/recommended');
            const j = yield r.json();
            return Math.min(MAX_AMT, j.halfHourFee);
        }
        catch (e) {
            return MAX_AMT;
        }
    });
}
// https://mempool.space/api/v1/fees/recommended
function genChannelAndConfirmAccounting(acc) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("[WATCH]=> genChannelAndConfirmAccounting");
        const sat_per_byte = yield getSuggestedSatPerByte();
        console.log("[WATCH]=> sat_per_byte", sat_per_byte);
        try {
            const r = yield lightning.openChannel({
                node_pubkey: acc.pubkey,
                local_funding_amount: acc.amount,
                push_sat: 0,
                sat_per_byte
            });
            console.log("[WATCH]=> CHANNEL OPENED!", r);
            const fundingTxidRev = Buffer.from(r.funding_txid_bytes).toString('hex');
            const fundingTxid = fundingTxidRev.match(/.{2}/g).reverse().join("");
            yield models_1.models.Accounting.update({
                status: constants_1.default.statuses.received,
                fundingTxid: fundingTxid,
                amount: acc.amount
            }, {
                where: { id: acc.id }
            });
            console.log("[WATCH]=> ACCOUNTINGS UPDATED to received!", acc.id);
        }
        catch (e) {
            console.log('[ACCOUNTING] error creating channel', e);
        }
    });
}
function pollUTXOs() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("[WATCH]=> pollUTXOs");
        const accs = yield getPendingAccountings();
        if (!accs)
            return;
        console.log("[WATCH]=> accs", accs.length);
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
        console.log('[WATCH] received accountings:', received);
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
            peer: rec.pubkey
        });
        console.log('[WATCH] chans for pubkey:', rec.pubkey, chans);
        if (!(chans && chans.channels))
            return;
        chans.channels.forEach(chan => {
            if (chan.channel_point.includes(rec.fundingTxid)) {
                console.log('[WATCH] found channel to keysend!', chan);
                const msg = {
                    type: constants_1.default.message_types.keysend,
                };
                helpers.performKeysendMessage({
                    sender: owner,
                    destination_key: rec.pubkey,
                    amount: rec.amount,
                    msg,
                    success: function () {
                        console.log('[WATCH] complete! Updating accounting, id:', rec.id);
                        models_1.models.Accounting.update({
                            status: constants_1.default.statuses.confirmed,
                            chanId: chan.chan_id
                        }, {
                            where: { id: rec.id }
                        });
                    },
                    failure: function () {
                        console.log('[WATCH] failed final keysend');
                    }
                });
            }
        });
    });
}
function startWatchingUTXOs() {
    setInterval(pollUTXOs, 600000); // every 10 minutes
}
exports.startWatchingUTXOs = startWatchingUTXOs;
function queryOnchainAddress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> queryOnchainAddress');
        const uuid = short.generate();
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const app = req.params.app;
        const query = {
            type: 'onchain_address',
            uuid,
            app
        };
        const opts = {
            amt: constants_1.default.min_sat_amount,
            dest: hub_pubkey,
            data: {
                type: constants_1.default.message_types.query,
                message: {
                    content: JSON.stringify(query)
                },
                sender: { pub_key: owner.publicKey }
            }
        };
        try {
            yield network.signAndSend(opts);
        }
        catch (e) {
            res_1.failure(res, e);
            return;
        }
        let i = 0;
        let interval = setInterval(() => {
            if (i >= 15) {
                clearInterval(interval);
                delete queries[uuid];
                res_1.failure(res, 'no response received');
                return;
            }
            if (queries[uuid]) {
                res_1.success(res, queries[uuid].result);
                clearInterval(interval);
                delete queries[uuid];
                return;
            }
            i++;
        }, 1000);
    });
}
exports.queryOnchainAddress = queryOnchainAddress;
exports.receiveQuery = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const dat = payload.content || payload;
    const sender_pub_key = dat.sender.pub_key;
    const content = dat.message.content;
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    if (!sender_pub_key || !content || !owner) {
        return console.log('=> wrong query format');
    }
    let q;
    try {
        q = JSON.parse(content);
    }
    catch (e) {
        console.log("=> ERROR receiveQuery,", e);
        return;
    }
    console.log('=> query received', q);
    let result = '';
    switch (q.type) {
        case 'onchain_address':
            const addy = yield lightning.newAddress(lightning.NESTED_PUBKEY_HASH);
            const acc = {
                date: new Date(),
                pubkey: sender_pub_key,
                onchainAddress: addy,
                amount: 0,
                sourceApp: q.app,
                status: constants_1.default.statuses.pending,
                error: '',
            };
            yield models_1.models.Accounting.create(acc);
            result = addy;
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
        data: {
            type: constants_1.default.message_types.query_response,
            message: {
                content: JSON.stringify(ret)
            },
            sender: { pub_key: owner.publicKey }
        }
    };
    try {
        yield network.signAndSend(opts);
    }
    catch (e) {
        console.log("FAILED TO SEND QUERY_RESPONSE");
        return;
    }
});
exports.receiveQueryResponse = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('=> receiveQueryResponse');
    const dat = payload.content || payload;
    // const sender_pub_key = dat.sender.pub_key
    const content = dat.message.content;
    try {
        const q = JSON.parse(content);
        queries[q.uuid] = q;
    }
    catch (e) {
        console.log("=> ERROR receiveQueryResponse,", e);
    }
});
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=queries.js.map