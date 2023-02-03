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
exports.getHost = exports.verifySignedTimestamp = exports.genSignedTimestamp = exports.deleteChannel = exports.createChannel = exports.putstats = exports.putActivity = exports.get_tribe_data = exports.delete_tribe = exports.edit = exports.declare = exports.publish = exports.subscribe = exports.addExtraHost = exports.printTribesClients = exports.getTribeOwnersChatByUUID = exports.connect = exports.delete_bot = exports.declare_bot = void 0;
const moment = require("moment");
const zbase32 = require("./zbase32");
const LND = require("../grpc/lightning");
const mqtt = require("mqtt");
const node_fetch_1 = require("node-fetch");
const models_1 = require("../models");
const tribeBots_1 = require("./tribeBots");
Object.defineProperty(exports, "declare_bot", { enumerable: true, get: function () { return tribeBots_1.declare_bot; } });
Object.defineProperty(exports, "delete_bot", { enumerable: true, get: function () { return tribeBots_1.delete_bot; } });
const config_1 = require("./config");
const proxy_1 = require("./proxy");
const sequelize_1 = require("sequelize");
const logger_1 = require("./logger");
const helpers_1 = require("../helpers");
const config = (0, config_1.loadConfig)();
// {pubkey: {host: Client} }
const clients = {};
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
        const isOwner = (0, proxy_1.isProxy)() ? "'t'" : '1';
        try {
            const r = (yield models_1.sequelize.query(`
      SELECT sphinx_chats.* FROM sphinx_chats
      INNER JOIN sphinx_contacts
      ON sphinx_chats.owner_pubkey = sphinx_contacts.public_key
      AND sphinx_contacts.is_owner = ${isOwner}
      AND sphinx_contacts.id = sphinx_chats.tenant
      AND sphinx_chats.uuid = '${uuid}'`, {
                model: models_1.models.Chat,
                mapToModel: true, // pass true here if you have any mapped fields
            }));
            // console.log('=> getTribeOwnersChatByUUID r:', r)
            return r && r[0] && r[0].dataValues;
        }
        catch (e) {
            logger_1.sphinxLogger.error(e);
        }
    });
}
exports.getTribeOwnersChatByUUID = getTribeOwnersChatByUUID;
function initializeClient(pubkey, host, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        let connected = false;
        function reconnect() {
            return __awaiter(this, void 0, void 0, function* () {
                console.log('reconencnt now');
                try {
                    const pwd = yield genSignedTimestamp(pubkey);
                    if (connected)
                        return;
                    let url = mqttURL(host);
                    console.log('mqtt url', url, pubkey, pwd);
                    const cl = mqtt.connect(url, {
                        username: pubkey,
                        password: pwd,
                        // reconnectPeriod: 0, // dont auto reconnect
                        clientId: 'test-client-id-again',
                    });
                    logger_1.sphinxLogger.info(`try to connect: ${url}`, logger_1.logging.Tribes);
                    cl.on('connect', function () {
                        return __awaiter(this, void 0, void 0, function* () {
                            // first check if its already connected to this host (in case it takes a long time)
                            connected = true;
                            if (clients[pubkey] &&
                                clients[pubkey][host] &&
                                clients[pubkey][host].connected) {
                                return clients[pubkey][host];
                                return;
                            }
                            logger_1.sphinxLogger.info(`MQTT connected!`, logger_1.logging.Tribes);
                            if (!clients[pubkey])
                                clients[pubkey] = {};
                            clients[pubkey][host] = cl; // ADD TO MAIN STATE
                            cl.on('close', function (e) {
                                logger_1.sphinxLogger.info(`CLOSE ${e}`, logger_1.logging.Tribes);
                                // setTimeout(() => reconnect(), 2000);
                                connected = false;
                                if (clients[pubkey] && clients[pubkey][host]) {
                                    delete clients[pubkey][host];
                                }
                            });
                            cl.on('error', function (e) {
                                logger_1.sphinxLogger.error(`error:  ${e.message}`, logger_1.logging.Tribes);
                            });
                            cl.on('message', function (topic, message) {
                                // console.log("============>>>>> GOT A MSG", topic, message)
                                if (onMessage)
                                    onMessage(topic, message);
                            });
                            cl.on('reconnect', () => {
                                console.log('reconnecting!');
                            });
                            cl.subscribe(`${pubkey}/#`, function (err) {
                                if (err)
                                    logger_1.sphinxLogger.error(`error subscribing ${err}`, logger_1.logging.Tribes);
                                else {
                                    logger_1.sphinxLogger.info(`subscribed! ${pubkey}/#`, logger_1.logging.Tribes);
                                    return cl;
                                }
                            });
                        });
                    });
                }
                catch (e) {
                    logger_1.sphinxLogger.error(`error initializing ${e}`, logger_1.logging.Tribes);
                }
            });
        }
        while (true) {
            if (!connected) {
                reconnect();
            }
            yield (0, helpers_1.sleep)(20000 + Math.round(Math.random() * 8000));
        }
    });
}
function lazyClient(pubkey, host, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('laxy client');
        if (clients[pubkey] &&
            clients[pubkey][host] &&
            clients[pubkey][host].connected) {
            return clients[pubkey][host];
        }
        console.log('initialize now');
        const cl = yield initializeClient(pubkey, host, onMessage);
        return cl;
    });
}
function initAndSubscribeTopics(onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        const host = getHost();
        try {
            if ((0, proxy_1.isProxy)()) {
                const allOwners = (yield models_1.models.Contact.findAll({
                    where: { isOwner: true },
                }));
                console.log('PROXY USERS LENGTH', allOwners.length);
                if (!(allOwners && allOwners.length))
                    return;
                (0, helpers_1.asyncForEach)(allOwners, (c) => __awaiter(this, void 0, void 0, function* () {
                    console.log('C . ID', c.id);
                    if (c.id === 1)
                        return; // the proxy non user
                    if (c.publicKey && c.publicKey.length === 66) {
                        console.log('OK DO NOW!', c.publicKey);
                        yield lazyClient(c.publicKey, host, onMessage);
                        yield subExtraHostsForTenant(c.id, c.publicKey, onMessage); // 1 is the tenant id on non-proxy
                    }
                }));
            }
            else {
                // just me
                const info = yield LND.getInfo(false);
                yield lazyClient(info.identity_pubkey, host, onMessage);
                updateTribeStats(info.identity_pubkey);
                subExtraHostsForTenant(1, info.identity_pubkey, onMessage); // 1 is the tenant id on non-proxy
            }
        }
        catch (e) {
            logger_1.sphinxLogger.error(`TRIBES ERROR ${e}`);
        }
    });
}
function subExtraHostsForTenant(tenant, pubkey, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        const host = getHost();
        const externalTribes = yield models_1.models.Chat.findAll({
            where: {
                tenant,
                host: { [sequelize_1.Op.ne]: host }, // not the host from config
            },
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
                    logger_1.sphinxLogger.error(`subscribe error 2 ${err}`, logger_1.logging.Tribes);
            });
        }));
    });
}
function printTribesClients() {
    const ret = {};
    Object.entries(clients).forEach((entry) => {
        const pk = entry[0];
        const obj = entry[1];
        ret[pk] = {};
        Object.keys(obj).forEach((host) => {
            ret[pk][host] = true;
        });
    });
    return JSON.stringify(ret);
}
exports.printTribesClients = printTribesClients;
function addExtraHost(pubkey, host, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log("ADD EXTRA HOST", printTribesClients(), host);
        if (getHost() === host)
            return; // not for default host
        if (clients[pubkey] && clients[pubkey][host])
            return; // already exists
        const client = yield lazyClient(pubkey, host, onMessage);
        client.subscribe(`${pubkey}/#`, optz);
    });
}
exports.addExtraHost = addExtraHost;
function mqttURL(h) {
    let host = config.mqtt_host || h;
    let protocol = 'tls';
    if (config.tribes_insecure) {
        protocol = 'tcp';
    }
    let port = 8883;
    if (config.tribes_mqtt_port) {
        port = config.tribes_mqtt_port;
    }
    if (host.includes(':')) {
        const arr = host.split(':');
        host = arr[0];
    }
    return `${protocol}://${host}:${port}`;
}
// for proxy, need to get all isOwner contacts and their owned chats
function updateTribeStats(myPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, proxy_1.isProxy)())
            return; // skip on proxy for now?
        const myTribes = (yield models_1.models.Chat.findAll({
            where: {
                ownerPubkey: myPubkey,
                deleted: false,
            },
        }));
        yield (0, helpers_1.asyncForEach)(myTribes, (tribe) => __awaiter(this, void 0, void 0, function* () {
            try {
                const contactIds = JSON.parse(tribe.contactIds);
                const member_count = (contactIds && contactIds.length) || 0;
                yield putstats({
                    uuid: tribe.uuid,
                    host: tribe.host,
                    member_count,
                    chatId: tribe.id,
                    owner_pubkey: myPubkey,
                });
            }
            catch (e) {
                // dont care about the error
            }
        }));
        if (myTribes.length) {
            logger_1.sphinxLogger.info(`updated stats for ${myTribes.length} tribes`, logger_1.logging.Tribes);
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
                logger_1.sphinxLogger.info(`added sub ${host} ${topic}`, logger_1.logging.Tribes);
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
                    logger_1.sphinxLogger.error(`error publishing ${err}`, logger_1.logging.Tribes);
                else if (cb)
                    cb();
            });
    });
}
exports.publish = publish;
function declare({ uuid, name, description, tags, img, group_key, host, price_per_message, price_to_join, owner_alias, owner_pubkey, escrow_amount, escrow_millis, unlisted, is_private, app_url, feed_url, feed_type, owner_route_hint, pin, profile_filters, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(protocol + '://' + host + '/tribes', {
                method: 'POST',
                body: JSON.stringify({
                    uuid,
                    group_key,
                    name,
                    description,
                    tags,
                    img: img || '',
                    price_per_message: price_per_message || 0,
                    price_to_join: price_to_join || 0,
                    owner_alias,
                    owner_pubkey,
                    escrow_amount: escrow_amount || 0,
                    escrow_millis: escrow_millis || 0,
                    unlisted: unlisted || false,
                    private: is_private || false,
                    app_url: app_url || '',
                    feed_url: feed_url || '',
                    feed_type: feed_type || 0,
                    owner_route_hint: owner_route_hint || '',
                    pin: pin || '',
                    profile_filters,
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw 'failed to create tribe ' + r.status;
            }
            // const j = await r.json()
        }
        catch (e) {
            logger_1.sphinxLogger.error(`unauthorized to declare`, logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.declare = declare;
function edit({ uuid, host, name, description, tags, img, price_per_message, price_to_join, owner_alias, escrow_amount, escrow_millis, unlisted, is_private, app_url, feed_url, feed_type, deleted, owner_route_hint, owner_pubkey, pin, profile_filters, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield genSignedTimestamp(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(protocol + '://' + host + '/tribe?token=' + token, {
                method: 'PUT',
                body: JSON.stringify({
                    uuid,
                    name,
                    description,
                    tags,
                    img: img || '',
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
                    feed_type: feed_type || 0,
                    owner_route_hint: owner_route_hint || '',
                    pin: pin || '',
                    profile_filters,
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw 'failed to edit tribe ' + r.status;
            }
            // const j = await r.json()
        }
        catch (e) {
            logger_1.sphinxLogger.error(`unauthorized to edit`, logger_1.logging.Tribes);
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
            const r = yield (0, node_fetch_1.default)(`${protocol}://${host}/tribe/${uuid}?token=${token}`, {
                method: 'DELETE',
            });
            if (!r.ok) {
                throw 'failed to delete tribe ' + r.status;
            }
            // const j = await r.json()
        }
        catch (e) {
            logger_1.sphinxLogger.error(`unauthorized to delete`, logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.delete_tribe = delete_tribe;
function get_tribe_data(uuid) {
    return __awaiter(this, void 0, void 0, function* () {
        const host = getHost();
        try {
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(`${protocol}://${host}/tribes/${uuid}`);
            if (!r.ok) {
                throw 'failed to get tribe ' + r.status;
            }
            const j = yield r.json();
            return j;
        }
        catch (e) {
            logger_1.sphinxLogger.error(`couldnt get tribe`, logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.get_tribe_data = get_tribe_data;
function putActivity(uuid, host, owner_pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield genSignedTimestamp(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            yield (0, node_fetch_1.default)(`${protocol}://${host}/tribeactivity/${uuid}?token=` + token, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
            });
        }
        catch (e) {
            logger_1.sphinxLogger.error(`unauthorized to putActivity`, logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.putActivity = putActivity;
function putstats({ uuid, host, member_count, chatId, owner_pubkey, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!uuid)
            return;
        const bots = yield (0, tribeBots_1.makeBotsJSON)(chatId);
        try {
            const token = yield genSignedTimestamp(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            yield (0, node_fetch_1.default)(protocol + '://' + host + '/tribestats?token=' + token, {
                method: 'PUT',
                body: JSON.stringify({
                    uuid,
                    member_count,
                    bots: JSON.stringify(bots || []),
                }),
                headers: { 'Content-Type': 'application/json' },
            });
        }
        catch (e) {
            logger_1.sphinxLogger.error(`unauthorized to putstats`, logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.putstats = putstats;
function createChannel({ tribe_uuid, host, name, owner_pubkey, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!tribe_uuid)
            return;
        if (!name)
            return;
        try {
            const token = yield genSignedTimestamp(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(protocol + '://' + host + '/channel?token=' + token, {
                method: 'POST',
                body: JSON.stringify({
                    tribe_uuid,
                    name,
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw 'failed to create tribe channel ' + r.status;
            }
            const j = yield r.json();
            return j;
        }
        catch (e) {
            logger_1.sphinxLogger.error(`unauthorized to create channel`, logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.createChannel = createChannel;
function deleteChannel({ id, host, owner_pubkey, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!id)
            return;
        try {
            const token = yield genSignedTimestamp(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(protocol + '://' + host + '/channel/' + id + '?token=' + token, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw 'failed to delete channel' + r.status;
            }
            const j = yield r.json();
            return j;
        }
        catch (e) {
            logger_1.sphinxLogger.error(`unauthorized to create channel`, logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.deleteChannel = deleteChannel;
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
//# sourceMappingURL=tribes.js.map