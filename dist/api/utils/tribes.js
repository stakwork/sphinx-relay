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
const moment = require("moment");
const zbase32 = require("./zbase32");
const LND = require("./lightning");
const path = require("path");
const mqtt = require("mqtt");
const node_fetch_1 = require("node-fetch");
const models_1 = require("../models");
const tribeBots_1 = require("./tribeBots");
exports.declare_bot = tribeBots_1.declare_bot;
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../../config/app.json'))[env];
let client;
function connect(onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const info = yield LND.getInfo();
            function reconnect() {
                return __awaiter(this, void 0, void 0, function* () {
                    client = null;
                    const pwd = yield genSignedTimestamp();
                    console.log('[tribes] try to connect:', `tls://${config.tribes_host}:8883`);
                    client = mqtt.connect(`tls://${config.tribes_host}:8883`, {
                        username: info.identity_pubkey,
                        password: pwd,
                        reconnectPeriod: 0,
                    });
                    client.on('connect', function () {
                        return __awaiter(this, void 0, void 0, function* () {
                            console.log("[tribes] connected!");
                            client.subscribe(`${info.identity_pubkey}/#`);
                            updateTribeStats(info.identity_pubkey);
                            const rndToken = yield genSignedTimestamp();
                            console.log('=> random sig', rndToken);
                        });
                    });
                    client.on('close', function (e) {
                        setTimeout(() => reconnect(), 2000);
                    });
                    client.on('error', function (e) {
                        console.log('[tribes] error: ', e.message || e);
                    });
                    client.on('message', function (topic, message) {
                        if (onMessage)
                            onMessage(topic, message);
                    });
                });
            }
            reconnect();
        }
        catch (e) {
            console.log("TRIBES ERROR", e);
        }
    });
}
exports.connect = connect;
function updateTribeStats(myPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const myTribes = yield models_1.models.Chat.findAll({
            where: {
                ownerPubkey: myPubkey
            }
        });
        yield asyncForEach(myTribes, (tribe) => __awaiter(this, void 0, void 0, function* () {
            try {
                const contactIds = JSON.parse(tribe.contactIds);
                const member_count = (contactIds && contactIds.length) || 0;
                yield putstats({ uuid: tribe.uuid, host: tribe.host, member_count, chatId: tribe.id });
            }
            catch (e) { }
        }));
        console.log(`[tribes] updated stats for ${myTribes.length} tribes`);
    });
}
function subscribe(topic) {
    if (client)
        client.subscribe(topic);
}
exports.subscribe = subscribe;
function publish(topic, msg, cb) {
    if (client)
        client.publish(topic, msg, null, function (err) {
            if (err)
                console.log(err);
            else if (cb)
                cb();
        });
}
exports.publish = publish;
function declare({ uuid, name, description, tags, img, group_key, host, price_per_message, price_to_join, owner_alias, owner_pubkey, escrow_amount, escrow_millis, unlisted, is_private, app_url }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield node_fetch_1.default('https://' + host + '/tribes', {
                method: 'POST',
                body: JSON.stringify({
                    uuid, group_key,
                    name, description, tags, img: img || '',
                    price_per_message: price_per_message || 0,
                    price_to_join: price_to_join || 0,
                    owner_alias, owner_pubkey,
                    escrow_amount: escrow_amount || 0,
                    escrow_millis: escrow_millis || 0,
                    unlisted: unlisted || false,
                    private: is_private || false,
                    app_url: app_url || '',
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            // const j = await r.json()
        }
        catch (e) {
            console.log('[tribes] unauthorized to declare');
            throw e;
        }
    });
}
exports.declare = declare;
function edit({ uuid, host, name, description, tags, img, price_per_message, price_to_join, owner_alias, escrow_amount, escrow_millis, unlisted, is_private, app_url, deleted }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield genSignedTimestamp();
            yield node_fetch_1.default('https://' + host + '/tribe?token=' + token, {
                method: 'PUT',
                body: JSON.stringify({
                    uuid,
                    name, description, tags, img: img || '',
                    price_per_message: price_per_message || 0,
                    price_to_join: price_to_join || 0,
                    escrow_amount: escrow_amount || 0,
                    escrow_millis: escrow_millis || 0,
                    owner_alias,
                    unlisted: unlisted || false,
                    private: is_private || false,
                    deleted: deleted || false,
                    app_url: app_url || '',
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            // const j = await r.json()
        }
        catch (e) {
            console.log('[tribes] unauthorized to edit');
            throw e;
        }
    });
}
exports.edit = edit;
function delete_tribe({ uuid }) {
    return __awaiter(this, void 0, void 0, function* () {
        const host = getHost();
        try {
            const token = yield genSignedTimestamp();
            console.log('=> delete_tribe', `https://${host}/tribe/${uuid}?token=${token}`);
            yield node_fetch_1.default(`https://${host}/tribe/${uuid}?token=${token}`, {
                method: 'DELETE',
            });
            // const j = await r.json()
        }
        catch (e) {
            console.log('[tribes] unauthorized to delete');
            throw e;
        }
    });
}
exports.delete_tribe = delete_tribe;
function putActivity(uuid, host) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield genSignedTimestamp();
            yield node_fetch_1.default(`https://${host}/tribeactivity/${uuid}?token=` + token, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
        }
        catch (e) {
            console.log('[tribes] unauthorized to putActivity');
            throw e;
        }
    });
}
exports.putActivity = putActivity;
function putstats({ uuid, host, member_count, chatId }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!uuid)
            return;
        const bots = yield tribeBots_1.makeBotsJSON(chatId);
        try {
            const token = yield genSignedTimestamp();
            yield node_fetch_1.default('https://' + host + '/tribestats?token=' + token, {
                method: 'PUT',
                body: JSON.stringify({
                    uuid, member_count, bots: JSON.stringify(bots || [])
                }),
                headers: { 'Content-Type': 'application/json' }
            });
        }
        catch (e) {
            console.log('[tribes] unauthorized to putstats');
            throw e;
        }
    });
}
exports.putstats = putstats;
function genSignedTimestamp() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = moment().unix();
        const tsBytes = Buffer.from(now.toString(16), 'hex');
        const sig = yield LND.signBuffer(tsBytes);
        const sigBytes = zbase32.decode(sig);
        const totalLength = tsBytes.length + sigBytes.length;
        const buf = Buffer.concat([tsBytes, sigBytes], totalLength);
        return urlBase64(buf);
    });
}
exports.genSignedTimestamp = genSignedTimestamp;
function verifySignedTimestamp(stsBase64) {
    return __awaiter(this, void 0, void 0, function* () {
        const stsBuf = Buffer.from(stsBase64, 'base64');
        const sig = stsBuf.subarray(4, 92);
        const sigZbase32 = zbase32.encode(sig);
        const r = yield LND.verifyBytes(stsBuf.subarray(0, 4), sigZbase32); // sig needs to be zbase32 :(
        if (r.valid) {
            return r.pubkey;
        }
        else {
            return false;
        }
    });
}
exports.verifySignedTimestamp = verifySignedTimestamp;
function getHost() {
    return config.tribes_host || '';
}
exports.getHost = getHost;
function urlBase64(buf) {
    return buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
}
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=tribes.js.map