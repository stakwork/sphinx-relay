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
exports.updateRemoteTribeServer = exports.verifyTribePreviewUrl = exports.getCacheMsg = exports.getHost = exports.verifySignedTimestamp = exports.genSignedTimestamp = exports.deleteChannel = exports.createChannel = exports.putstats = exports.putActivity = exports.get_tribe_data = exports.delete_tribe = exports.edit = exports.declare = exports.getTribeOwnersChatByUUID = exports.addExtraHost = exports.printTribesClients = exports.publish = exports.newSubscription = exports.connect = exports.delete_bot = exports.declare_bot = void 0;
const moment = require("moment");
const mqtt = require("mqtt");
const node_fetch_1 = require("node-fetch");
const LND = require("../grpc/lightning");
const models_1 = require("../models");
const helpers_1 = require("../helpers");
const interfaces_1 = require("../grpc/interfaces");
const zbase32 = require("./zbase32");
const logger_1 = require("./logger");
const proxy_1 = require("./proxy");
const config_1 = require("./config");
const tribeBots_1 = require("./tribeBots");
Object.defineProperty(exports, "declare_bot", { enumerable: true, get: function () { return tribeBots_1.declare_bot; } });
Object.defineProperty(exports, "delete_bot", { enumerable: true, get: function () { return tribeBots_1.delete_bot; } });
const config = (0, config_1.loadConfig)();
// MAIN CLIENTS STATE (caching already connected clients)
// {pubkey: {host: Client} }
const CLIENTS = {};
const optz = { qos: 0 };
let XPUB_RES;
// this runs at relay startup
function connect(onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        initAndSubscribeTopics(onMessage);
    });
}
exports.connect = connect;
function initAndSubscribeTopics(onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.debug('initAndSubscribeTopics', logger_1.logging.Tribes);
        const host = getHost();
        try {
            logger_1.sphinxLogger.debug(`contacts where isOwner true`, logger_1.logging.Tribes);
            const allOwners = (yield models_1.models.Contact.findAll({
                where: { isOwner: true },
            }));
            // We found no owners
            if (!(allOwners && allOwners.length))
                return;
            logger_1.sphinxLogger.debug(`looping all the owners and subscribing`, logger_1.logging.Tribes);
            yield (0, helpers_1.asyncForEach)(allOwners, (c) => __awaiter(this, void 0, void 0, function* () {
                if (c.publicKey && c.publicKey.length === 66) {
                    // if is proxy and no auth token dont subscribe yet... will subscribe when signed up
                    if ((0, proxy_1.isProxy)() && !c.authToken)
                        return;
                    logger_1.sphinxLogger.debug(`lazyClient for ${c.publicKey}`, logger_1.logging.Tribes);
                    yield lazyClient(c, host, onMessage, allOwners);
                }
            }));
            logger_1.sphinxLogger.info('[TRIBES] all CLIENTS + subscriptions complete!');
        }
        catch (e) {
            logger_1.sphinxLogger.error(`TRIBES ERROR, initAndSubscribeTopics ${e}`);
        }
    });
}
// In this function we are initializing the mqtt client
// for every user on this relay
function initializeClient(contact, host, onMessage, xpubres, allOwners) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.debug(`Initializing client`, logger_1.logging.Tribes);
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let connected = false;
            function reconnect() {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        let signer = contact.publicKey;
                        if (xpubres && xpubres.pubkey)
                            signer = xpubres.pubkey;
                        logger_1.sphinxLogger.debug(`Initializing client, genSignedTimestamp`, logger_1.logging.Tribes);
                        const pwd = yield genSignedTimestamp(signer);
                        logger_1.sphinxLogger.debug(`Initializing client, finished genSignedTimestamp`, logger_1.logging.Tribes);
                        if (connected)
                            return;
                        const url = mqttURL(host);
                        let username = contact.publicKey;
                        if (xpubres && xpubres.xpub)
                            username = xpubres.xpub;
                        logger_1.sphinxLogger.info(`connect with token: ${pwd}`, logger_1.logging.Tribes);
                        const cl = mqtt.connect(url, {
                            username: username,
                            password: pwd,
                            reconnectPeriod: 0, // dont auto reconnect
                        });
                        logger_1.sphinxLogger.info(`try to connect: ${url}`, logger_1.logging.Tribes);
                        cl.on('connect', function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                // first check if its already connected to this host (in case it takes a long time)
                                connected = true;
                                if (CLIENTS[username] &&
                                    CLIENTS[username][host] &&
                                    CLIENTS[username][host].connected) {
                                    resolve({ client: CLIENTS[username][host], isFresh: false });
                                    return;
                                }
                                logger_1.sphinxLogger.info(`connected!`, logger_1.logging.Tribes);
                                // ADD TO MAIN CLIENTS STATE
                                if (!CLIENTS[username])
                                    CLIENTS[username] = {};
                                CLIENTS[username][host] = cl;
                                // for HD-enabled proxy, subscribe to all owners pubkeys here
                                if (xpubres && allOwners) {
                                    for (const o of allOwners) {
                                        // contact #1 has his own client
                                        const isFirstUser = contact.id === 1;
                                        if (!isFirstUser)
                                            yield specialSubscribe(cl, o);
                                    }
                                }
                                else {
                                    // else just this contact (legacy)
                                    yield specialSubscribe(cl, contact);
                                }
                                // If we close the connection
                                cl.on('close', function (e) {
                                    logger_1.sphinxLogger.info(`CLOSE ${e}`, logger_1.logging.Tribes);
                                    connected = false;
                                    // REMOVE FROM MAIN CLIENTS STATE
                                    if (CLIENTS[username] && CLIENTS[username][host]) {
                                        delete CLIENTS[username][host];
                                    }
                                });
                                // If there is an error on any connection
                                cl.on('error', function (e) {
                                    logger_1.sphinxLogger.error(`error:  ${e.message}`, logger_1.logging.Tribes);
                                });
                                // message type what we do on a new message
                                cl.on('message', function (topic, message) {
                                    logger_1.sphinxLogger.debug(`============>>>>> GOT A MSG ${topic} ${message}`, logger_1.logging.Tribes);
                                    if (onMessage)
                                        onMessage(topic, message);
                                });
                                // new client! isFresh = true
                                resolve({ client: cl, isFresh: true });
                            });
                        });
                    }
                    catch (e) {
                        logger_1.sphinxLogger.error(`error initializing ${e}`, logger_1.logging.Tribes);
                    }
                });
            }
            // retrying connection till sucessfull
            while (true) {
                if (!connected) {
                    reconnect();
                }
                yield (0, helpers_1.sleep)(5000 + Math.round(Math.random() * 8000));
            }
        }));
    });
}
function proxyXpub() {
    return __awaiter(this, void 0, void 0, function* () {
        if (XPUB_RES && XPUB_RES.pubkey && XPUB_RES.pubkey)
            return XPUB_RES;
        const xpub_res = yield (0, proxy_1.getProxyXpub)();
        XPUB_RES = xpub_res;
        return xpub_res;
    });
}
function lazyClient(contact, host, onMessage, allOwners) {
    return __awaiter(this, void 0, void 0, function* () {
        let username = contact.publicKey;
        let xpubres;
        // "first user" is the pubkey of the lightning node behind proxy
        // they DO NOT use the xpub auth
        const isFirstUser = contact.id === 1;
        if (config.proxy_hd_keys && !isFirstUser) {
            xpubres = yield proxyXpub();
            // set the username to be the xpub
            if (xpubres === null || xpubres === void 0 ? void 0 : xpubres.xpub)
                username = xpubres === null || xpubres === void 0 ? void 0 : xpubres.xpub;
        }
        if (CLIENTS[username] &&
            CLIENTS[username][host] &&
            CLIENTS[username][host].connected) {
            return { client: CLIENTS[username][host], isFresh: false };
        }
        return yield initializeClient(contact, host, onMessage, xpubres, allOwners);
    });
}
function newSubscription(c, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> newSubscription:', c.publicKey);
        const host = getHost();
        const lazy = yield lazyClient(c, host, onMessage);
        if (!lazy.isFresh) {
            // if its a cached client (HD proxy mode, 2nd virtual owner)
            yield specialSubscribe(lazy.client, c);
        }
    });
}
exports.newSubscription = newSubscription;
function specialSubscribe(cl, c) {
    if (config.proxy_hd_keys && c.id != 1 && c.routeHint) {
        const index = (0, interfaces_1.txIndexFromChannelId)(parseRouteHint(c.routeHint));
        hdSubscribe(c.publicKey, index, cl);
    }
    else {
        cl.subscribe(`${c.publicKey}/#`);
    }
}
function publish(topic, msg, owner, cb, isFirstUser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (owner.publicKey.length !== 66) {
            return logger_1.sphinxLogger.warning('invalid pubkey, not 66 len');
        }
        const host = getHost();
        const lazy = yield lazyClient(owner, host);
        if (lazy === null || lazy === void 0 ? void 0 : lazy.client)
            lazy.client.publish(topic, msg, optz, function (err) {
                if (err)
                    logger_1.sphinxLogger.error(`error publishing ${err}`, logger_1.logging.Tribes);
                else if (cb)
                    cb();
            });
    });
}
exports.publish = publish;
// async function subExtraHostsForTenant(
//   tenant: number,
//   pubkey: string,
//   onMessage: (topic: string, message: Buffer) => void
// ) {
//   const host = getHost()
//   const externalTribes = await models.Chat.findAll({
//     where: {
//       tenant,
//       host: { [Op.ne]: host }, // not the host from config
//     },
//   })
//   if (!(externalTribes && externalTribes.length)) return
//   const usedHosts: string[] = []
//   externalTribes.forEach(async (et: Chat) => {
//     if (usedHosts.includes(et.host)) return
//     usedHosts.push(et.host) // dont do it twice
//     const client = await lazyClient(pubkey, host, onMessage)
//     client.subscribe(`${pubkey}/#`, optz, function (err) {
//       if (err) sphinxLogger.error(`subscribe error 2 ${err}`, logging.Tribes)
//     })
//   })
// }
function printTribesClients() {
    const ret = {};
    Object.entries(CLIENTS).forEach((entry) => {
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
function addExtraHost(contact, host, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        const pubkey = contact.publicKey;
        // console.log("ADD EXTRA HOST", printTribesClients(), host);
        if (getHost() === host)
            return; // not for default host
        if (CLIENTS[pubkey] && CLIENTS[pubkey][host])
            return; // already exists
        yield lazyClient(contact, host, onMessage);
        // client.subscribe(`${pubkey}/#`, optz)
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
// async function updateTribeStats(myPubkey) {
//   if (isProxy()) return // skip on proxy for now?
//   const myTribes = (await models.Chat.findAll({
//     where: {
//       ownerPubkey: myPubkey,
//       deleted: false,
//     },
//   })) as Chat[]
//   await asyncForEach(myTribes, async (tribe) => {
//     try {
//       const contactIds = JSON.parse(tribe.contactIds)
//       const member_count = (contactIds && contactIds.length) || 0
//       await putstats({
//         uuid: tribe.uuid,
//         host: tribe.host,
//         member_count,
//         chatId: tribe.id,
//         owner_pubkey: myPubkey,
//       })
//     } catch (e) {
//       // dont care about the error
//     }
//   })
//   if (myTribes.length) {
//     sphinxLogger.info(
//       `updated stats for ${myTribes.length} tribes`,
//       logging.Tribes
//     )
//   }
// }
// export async function subscribe(
//   topic: string,
//   onMessage: (topic: string, message: Buffer) => void
// ): Promise<void> {
//   const pubkey = topic.split('/')[0]
//   if (pubkey.length !== 66) return
//   const host = getHost()
//   const client = await lazyClient(pubkey, host, onMessage)
//   if (client)
//     client.subscribe(topic, function () {
//       sphinxLogger.info(`added sub ${host} ${topic}`, logging.Tribes)
//     })
// }
function getTribeOwnersChatByUUID(uuid) {
    return __awaiter(this, void 0, void 0, function* () {
        const isOwner = (0, models_1.isPostgres)() ? "'t'" : '1';
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
// Creates a signed timestamp with the
// hosts public key
function genSignedTimestamp(ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.debug(`genSignedTimestamp, start`, logger_1.logging.Tribes);
        const now = moment().unix();
        logger_1.sphinxLogger.debug(`genSignedTimestamp, loading lightining`, logger_1.logging.Tribes);
        const lightining = yield LND.loadLightning();
        let contact;
        try {
            contact = (yield models_1.models.Contact.findOne({
                where: { isOwner: true, publicKey: ownerPubkey },
            }));
        }
        catch (e) {
            logger_1.sphinxLogger.error(`genSignedTimestamp, failed to get contact ${e}`, logger_1.logging.Tribes);
            throw e;
        }
        const tsBytes = Buffer.from(now.toString(16), 'hex');
        const utf8Sign = LND.isCLN(lightining) && contact && contact.id === 1;
        let sig = '';
        if (utf8Sign) {
            const bytesBase64 = urlBase64(tsBytes);
            const bytesUtf8 = Buffer.from(bytesBase64, 'utf8');
            sig = yield LND.signBuffer(bytesUtf8, ownerPubkey);
        }
        else {
            sig = yield LND.signBuffer(tsBytes, ownerPubkey);
        }
        const sigBytes = zbase32.decode(sig);
        const totalLength = tsBytes.length + sigBytes.length;
        const buf = Buffer.concat([tsBytes, sigBytes], totalLength);
        return utf8Sign ? '.' + urlBase64(buf) : urlBase64(buf);
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
function hdSubscribe(pubkey, index, client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield subscribeAndCheck(client, `${pubkey}/#`);
        }
        catch (e) {
            try {
                console.log('=> first time connect');
                yield subscribeAndCheck(client, `${pubkey}/INDEX_${index}`);
                yield subscribeAndCheck(client, `${pubkey}/#`);
            }
            catch (error) {
                console.log(error);
                logger_1.sphinxLogger.error([`error subscribing`, error, logger_1.logging.Tribes]);
            }
        }
    });
}
function subscribeAndCheck(client, topic) {
    return new Promise((resolve, reject) => {
        try {
            client.subscribe(topic, function (err, granted) {
                if (!err) {
                    const qos = granted && granted[0] && granted[0].qos;
                    // https://github.com/mqttjs/MQTT.js/pull/351
                    if ([0, 1, 2].includes(qos)) {
                        logger_1.sphinxLogger.info(`subscribed! ${granted[0].topic}`, logger_1.logging.Tribes);
                        resolve();
                    }
                    else {
                        reject(`Could not subscribe topic: ${topic}`);
                    }
                }
                else {
                    console.log(err);
                    logger_1.sphinxLogger.error([`error subscribing`, err], logger_1.logging.Tribes);
                    reject();
                }
            });
        }
        catch (error) {
            console.log(error);
            reject();
        }
    });
}
function parseRouteHint(routeHint) {
    return routeHint.substring(routeHint.indexOf(':') + 1, routeHint.length);
}
function getCacheMsg({ preview, chat_uuid, chat_id, order, offset, limit, dateToReturn, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(`${protocol}://${preview}/api/msgs/${chat_uuid}?limit=${limit}&offset=${offset}&order=${order}&date=${dateToReturn}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw `get cache message for tribe with uuid: ${chat_uuid} ` + r.status;
            }
            const res = yield r.json();
            const updatedCacheMsg = [];
            for (let i = 0; i < res.length; i++) {
                const msg = res[i];
                updatedCacheMsg.push(Object.assign(Object.assign({}, msg), { chat_id, chatId: chat_id, cached: true }));
            }
            return updatedCacheMsg;
        }
        catch (error) {
            logger_1.sphinxLogger.error([
                `unanle to get cache message for tribe with uuid: ${chat_uuid}`,
                logger_1.logging.Tribes,
            ]);
            return [];
        }
    });
}
exports.getCacheMsg = getCacheMsg;
function verifyTribePreviewUrl(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(`${protocol}://${url}/api/pubkeys`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw `could not verify cache server` + r.status;
            }
            const res = yield r.json();
            return res;
        }
        catch (error) {
            console.log(error);
            throw `could not verify cache server`;
        }
    });
}
exports.verifyTribePreviewUrl = verifyTribePreviewUrl;
function updateRemoteTribeServer({ server, preview_url, chat_uuid, owner_pubkey, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let protocol = 'https';
            const token = yield genSignedTimestamp(owner_pubkey);
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(`${protocol}://${server}/tribepreview/${chat_uuid}?preview=${preview_url}&token=${token}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw `could not update tribe server with preview url ` + r.status;
            }
            const res = yield r.json();
            return res;
        }
        catch (error) {
            console.log(error);
            throw `could not update tribe server with preview url`;
        }
    });
}
exports.updateRemoteTribeServer = updateRemoteTribeServer;
//# sourceMappingURL=tribes.js.map