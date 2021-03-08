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
exports.getHost = exports.verifySignedTimestamp = exports.genSignedTimestamp = exports.putstats = exports.putActivity = exports.delete_tribe = exports.edit = exports.declare = exports.publish = exports.subscribe = exports.addExtraHost = exports.getTribeOwnersChatByUUID = exports.connect = exports.declare_bot = void 0;
const moment = require("moment");
const zbase32 = require("./zbase32");
const LND = require("./lightning");
const mqtt = require("mqtt");
const node_fetch_1 = require("node-fetch");
const models_1 = require("../models");
const tribeBots_1 = require("./tribeBots");
Object.defineProperty(exports, "declare_bot", { enumerable: true, get: function () { return tribeBots_1.declare_bot; } });
const config_1 = require("./config");
const proxy_1 = require("./proxy");
const sequelize_1 = require("sequelize");
const config = config_1.loadConfig();
// {pubkey: {host: Client} }
let clients = {};
const optz = { qos: 0 };
// this runs at relay startup
function connect(onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        initAndSubscribeTopics(onMessage);
    });
}
exports.connect = connect;
function getTribeOwnersChatByUUID(uuid) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield models_1.sequelize.query(`
      SELECT sphinx_chats.* FROM sphinx_chats
      INNER JOIN sphinx_contacts
      ON sphinx_chats.owner_pubkey = sphinx_contacts.public_key
      AND sphinx_chats.tenant = sphinx_contacts.tenant
      AND sphinx_chats.uuid = '${uuid}'`, {
                model: models_1.models.Chat,
                mapToModel: true // pass true here if you have any mapped fields
            });
            // console.log('=> getTribeOwnersChatByUUID r:', r)
            return r && r[0] && r[0].dataValues;
        }
        catch (e) {
            console.log(e);
        }
    });
}
exports.getTribeOwnersChatByUUID = getTribeOwnersChatByUUID;
function initializeClient(pubkey, host, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            function reconnect() {
                return __awaiter(this, void 0, void 0, function* () {
                    const pwd = yield genSignedTimestamp(pubkey);
                    const url = mqttURL(host);
                    const cl = mqtt.connect(url, {
                        username: pubkey,
                        password: pwd,
                        reconnectPeriod: 0,
                    });
                    console.log('[tribes] try to connect:', url);
                    cl.on('connect', function () {
                        return __awaiter(this, void 0, void 0, function* () {
                            console.log("[tribes] connected!");
                            cl.on('close', function (e) {
                                console.log('[tribes] CLOSE', e);
                                setTimeout(() => reconnect(), 2000);
                            });
                            cl.on('error', function (e) {
                                console.log('[tribes] error: ', e.message || e);
                            });
                            cl.on('message', function (topic, message) {
                                // console.log("============>>>>> GOT A MSG", topic, message)
                                if (onMessage)
                                    onMessage(topic, message);
                            });
                            cl.subscribe(`${pubkey}/#`, function (err) {
                                if (err)
                                    console.log('[tribes] error subscribing', err);
                                else {
                                    console.log('[tribes] subscribed!', `${pubkey}/#`);
                                    resolve(cl);
                                }
                            });
                        });
                    });
                });
            }
            reconnect();
        });
    });
}
function lazyClient(pubkey, host, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        if (clients[pubkey] && clients[pubkey][host]) {
            return clients[pubkey][host];
        }
        const cl = yield initializeClient(pubkey, host, onMessage);
        if (!clients[pubkey])
            clients[pubkey] = {};
        clients[pubkey][host] = cl; // ADD TO MAIN STATE
        return cl;
    });
}
function initAndSubscribeTopics(onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        const host = getHost();
        try {
            if (proxy_1.isProxy()) {
                const allOwners = yield models_1.models.Contact.findAll({ where: { isOwner: true } });
                if (!(allOwners && allOwners.length))
                    return;
                asyncForEach(allOwners, (c) => __awaiter(this, void 0, void 0, function* () {
                    if (c.id === 1)
                        return; // the proxy non user
                    if (c.publicKey && c.publicKey.length === 66) {
                        yield lazyClient(c.publicKey, host, onMessage);
                        yield subExtraHostsForTenant(c.id, c.publicKey, onMessage); // 1 is the tenant id on non-proxy
                    }
                }));
            }
            else { // just me
                const info = yield LND.getInfo(false);
                yield lazyClient(info.identity_pubkey, host, onMessage);
                updateTribeStats(info.identity_pubkey);
                subExtraHostsForTenant(1, info.identity_pubkey, onMessage); // 1 is the tenant id on non-proxy
            }
        }
        catch (e) {
            console.log("TRIBES ERROR", e);
        }
    });
}
function subExtraHostsForTenant(tenant, pubkey, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        const host = getHost();
        const externalTribes = yield models_1.models.Chat.findAll({
            where: {
                tenant,
                host: { [sequelize_1.Op.ne]: host } // not the host from config
            }
        });
        if (!(externalTribes && externalTribes.length))
            return;
        const usedHosts = [];
        externalTribes.forEach((et) => __awaiter(this, void 0, void 0, function* () {
            if (usedHosts.includes(et.host))
                return;
            usedHosts.push(et.host); // dont do it twice
            const client = yield lazyClient(pubkey, host, onMessage);
            client.subscribe(`${pubkey}/#`, optz, function (err) {
                if (err)
                    console.log("[tribes] subscribe error 2", err);
            });
        }));
    });
}
function printClients() {
    const ret = {};
    Object.entries(clients).forEach(entry => {
        const pk = entry[0];
        const obj = entry[1];
        ret[pk] = {};
        Object.keys(obj).forEach(host => {
            ret[pk][host] = true;
        });
    });
    return JSON.stringify(ret);
}
function addExtraHost(pubkey, host, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("ADD EXTRA HOST", printClients(), host);
        if (getHost() === host)
            return; // not for default host
        if (clients[pubkey] && clients[pubkey][host])
            return; // already exists
        const client = yield lazyClient(pubkey, host, onMessage);
        client.subscribe(`${pubkey}/#`, optz);
    });
}
exports.addExtraHost = addExtraHost;
// if host includes colon, remove it
function mqttURL(host) {
    if (host.includes(':')) {
        const arr = host.split(':');
        host = arr[0];
    }
    let port = '8883';
    let protocol = 'tls';
    if (config.tribes_mqtt_port) {
        port = config.tribes_mqtt_port;
    }
    if (config.tribes_insecure) {
        protocol = "tcp";
    }
    return `${protocol}://${host}:${port}`;
}
// for proxy, need to get all isOwner contacts and their owned chats
function updateTribeStats(myPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        if (proxy_1.isProxy())
            return; // skip on proxy for now?
        const myTribes = yield models_1.models.Chat.findAll({
            where: {
                ownerPubkey: myPubkey,
                deleted: false
            }
        });
        yield asyncForEach(myTribes, (tribe) => __awaiter(this, void 0, void 0, function* () {
            try {
                const contactIds = JSON.parse(tribe.contactIds);
                const member_count = (contactIds && contactIds.length) || 0;
                yield putstats({ uuid: tribe.uuid, host: tribe.host, member_count, chatId: tribe.id, owner_pubkey: myPubkey });
            }
            catch (e) { }
        }));
        if (myTribes.length) {
            console.log(`[tribes] updated stats for ${myTribes.length} tribes`);
        }
    });
}
function subscribe(topic, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        const pubkey = topic.split('/')[0];
        if (pubkey.length !== 66)
            return;
        const host = getHost();
        const client = yield lazyClient(pubkey, host, onMessage);
        if (client)
            client.subscribe(topic, function () {
                console.log('[tribes] added sub', host, topic);
            });
    });
}
exports.subscribe = subscribe;
function publish(topic, msg, ownerPubkey, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ownerPubkey.length !== 66)
            return;
        const host = getHost();
        const client = yield lazyClient(ownerPubkey, host);
        if (client)
            client.publish(topic, msg, optz, function (err) {
                if (err)
                    console.log('[tribes] error publishing', err);
                else if (cb)
                    cb();
            });
    });
}
exports.publish = publish;
function declare({ uuid, name, description, tags, img, group_key, host, price_per_message, price_to_join, owner_alias, owner_pubkey, escrow_amount, escrow_millis, unlisted, is_private, app_url, feed_url, owner_route_hint }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            yield node_fetch_1.default(protocol + '://' + host + '/tribes', {
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
                    feed_url: feed_url || '',
                    owner_route_hint: owner_route_hint || ''
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
function edit({ uuid, host, name, description, tags, img, price_per_message, price_to_join, owner_alias, escrow_amount, escrow_millis, unlisted, is_private, app_url, feed_url, deleted, owner_route_hint, owner_pubkey }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield genSignedTimestamp(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            yield node_fetch_1.default(protocol + '://' + host + '/tribe?token=' + token, {
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
                    feed_url: feed_url || '',
                    owner_route_hint: owner_route_hint || ''
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
function delete_tribe(uuid, owner_pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const host = getHost();
        try {
            const token = yield genSignedTimestamp(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            yield node_fetch_1.default(`${protocol}://${host}/tribe/${uuid}?token=${token}`, {
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
function putActivity(uuid, host, owner_pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield genSignedTimestamp(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            yield node_fetch_1.default(`${protocol}://${host}/tribeactivity/${uuid}?token=` + token, {
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
function putstats({ uuid, host, member_count, chatId, owner_pubkey }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!uuid)
            return;
        const bots = yield tribeBots_1.makeBotsJSON(chatId);
        try {
            const token = yield genSignedTimestamp(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            yield node_fetch_1.default(protocol + '://' + host + '/tribestats?token=' + token, {
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
function genSignedTimestamp(ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('genSignedTimestamp')
        const now = moment().unix();
        const tsBytes = Buffer.from(now.toString(16), 'hex');
        const sig = yield LND.signBuffer(tsBytes, ownerPubkey);
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