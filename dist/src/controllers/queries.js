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
let queries = {};
const hub_pubkey = '023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f';
function listUTXOs(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const utxos = yield wallet_1.listUnspent(); // at least 1 confg
            const addys = utxos.map(utxo => utxo.address);
            console.log('addys', addys);
            const accountings = yield models_1.models.Accounting.findAll({
                where: {
                    address: {
                        [sequelize_1.Op.in]: addys
                    },
                    status: constants_1.default.statuses.pending
                }
            });
            res_1.success(res, accountings.map(acc => jsonUtils.accountingToJson(acc)));
        }
        catch (e) {
            res_1.failure(res, e);
        }
    });
}
exports.listUTXOs = listUTXOs;
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
//# sourceMappingURL=queries.js.map