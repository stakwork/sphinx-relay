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
exports.getProxyXpub = exports.getProxyRootPubkey = exports.loadProxyLightning = exports.loadProxyCredentials = exports.getProxyTotalBalance = exports.generateNewExternalUser = exports.generateNewUser = exports.generateNewUsers = exports.genUsersInterval = exports.isProxy = void 0;
const fs = require("fs");
const grpc = require("@grpc/grpc-js");
const node_fetch_1 = require("node-fetch");
const sequelize_1 = require("sequelize");
const proto_1 = require("../grpc/proto");
const Lightning = require("../grpc/lightning");
const models_1 = require("../models");
const helpers_1 = require("../helpers");
const logger_1 = require("./logger");
const config_1 = require("./config");
// var protoLoader = require('@grpc/proto-loader')
const config = (0, config_1.loadConfig)();
const LND_IP = config.lnd_ip || 'localhost';
const PROXY_LND_IP = config.proxy_lnd_ip || 'localhost';
const IS_CLN = config.lightning_provider === 'CLN';
const check_proxy_balance = false;
function isProxy(client) {
    return config.proxy_lnd_port &&
        config.proxy_macaroons_dir &&
        config.proxy_tls_location
        ? true
        : false;
}
exports.isProxy = isProxy;
function genUsersInterval(ms) {
    if (!isProxy())
        return;
    setTimeout(() => {
        // so it starts a bit later than pingHub
        setInterval(generateNewUsers, ms);
    }, 2000);
}
exports.genUsersInterval = genUsersInterval;
const NEW_USER_NUM = config.proxy_new_nodes || config.proxy_new_nodes === 0
    ? config.proxy_new_nodes
    : 2;
let SATS_PER_USER = config.proxy_initial_sats;
if (!(SATS_PER_USER || SATS_PER_USER === 0))
    SATS_PER_USER = 5000;
// isOwner users with no authToken
function generateNewUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isProxy()) {
            logger_1.sphinxLogger.error(`not proxy`, logger_1.logging.Proxy);
            return;
        }
        const newusers = yield models_1.models.Contact.findAll({
            where: { isOwner: true, authToken: null, id: { [sequelize_1.Op.ne]: 1 } },
        });
        if (newusers.length >= NEW_USER_NUM) {
            logger_1.sphinxLogger.info(`already have new users`, logger_1.logging.Proxy);
            return; // we already have the mimimum
        }
        const n1 = NEW_USER_NUM - newusers.length;
        let n; // the number of new users to create
        if (check_proxy_balance) {
            const virtualBal = yield getProxyTotalBalance();
            logger_1.sphinxLogger.info(`total balance ${virtualBal}`, logger_1.logging.Proxy);
            const realBal = yield getProxyLNDBalance();
            logger_1.sphinxLogger.info(`LND balance ${virtualBal}`, logger_1.logging.Proxy);
            let availableBalance = realBal - virtualBal;
            if (availableBalance < SATS_PER_USER)
                availableBalance = 1;
            const n2 = Math.floor(availableBalance / SATS_PER_USER);
            const n = Math.min(n1, n2);
            if (!n) {
                logger_1.sphinxLogger.error(`not enough sats`, logger_1.logging.Proxy);
                return;
            }
        }
        else {
            n = n1;
        }
        logger_1.sphinxLogger.info(`gen new users: ${n}`, logger_1.logging.Proxy);
        const arr = new Array(n);
        const rootpk = yield getProxyRootPubkey();
        for (const _ of arr) {
            try {
                yield generateNewUser(rootpk, SATS_PER_USER);
            }
            catch (e) {
                logger_1.sphinxLogger.error('failed to generateNewUser' + e, logger_1.logging.Proxy);
                break;
            }
        }
    });
}
exports.generateNewUsers = generateNewUsers;
const adminURL = config.proxy_admin_url
    ? config.proxy_admin_url + '/'
    : 'http://localhost:5555/';
function generateNewUser(rootpk, initial_sat) {
    return __awaiter(this, void 0, void 0, function* () {
        let route = 'generate';
        if (initial_sat || initial_sat === 0) {
            route = `generate?sats=${initial_sat}`;
            logger_1.sphinxLogger.info(`new user with sats: ${initial_sat}`, logger_1.logging.Proxy);
        }
        const r = yield (0, node_fetch_1.default)(adminURL + route, {
            method: 'POST',
            headers: { 'x-admin-token': config.proxy_admin_token },
        });
        const j = yield r.json();
        const contact = {
            publicKey: j.pubkey,
            routeHint: `${rootpk}:${j.channel}`,
            isOwner: true,
            authToken: null,
        };
        const created = (yield models_1.models.Contact.create(contact));
        // set tenant to self!
        created.update({ tenant: created.id });
        logger_1.sphinxLogger.info(`=> CREATED OWNER: ${created.dataValues.publicKey}`);
        return created.dataValues;
    });
}
exports.generateNewUser = generateNewUser;
function generateNewExternalUser(pubkey, sig) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield (0, node_fetch_1.default)(adminURL + 'create_external', {
                method: 'POST',
                body: JSON.stringify({ pubkey, sig }),
                headers: { 'x-admin-token': config.proxy_admin_token },
            });
            const j = yield r.json();
            const rootpk = yield getProxyRootPubkey();
            return {
                publicKey: j.pubkey,
                routeHint: `${rootpk}:${j.channel}`,
            };
        }
        catch (e) {
            logger_1.sphinxLogger.error(`=> could not gen new external user ${e}`);
        }
    });
}
exports.generateNewExternalUser = generateNewExternalUser;
// "total" is in msats
function getProxyTotalBalance() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield (0, node_fetch_1.default)(adminURL + 'balances', {
                method: 'GET',
                headers: { 'x-admin-token': config.proxy_admin_token },
            });
            const j = yield r.json();
            return j.total ? Math.floor(j.total / 1000) : 0;
        }
        catch (e) {
            return 0;
        }
    });
}
exports.getProxyTotalBalance = getProxyTotalBalance;
function loadProxyCredentials(macPrefix) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < 100 && !fs.existsSync(config.proxy_tls_location); i++) {
            console.log('lndCert not found trying again:');
            yield (0, helpers_1.sleep)(10000);
        }
        const lndCert = fs.readFileSync(config.proxy_tls_location);
        const sslCreds = grpc.credentials.createSsl(lndCert);
        const m = fs.readFileSync(config.proxy_macaroons_dir + '/' + macPrefix + '.macaroon');
        const macaroon = m.toString('hex');
        const metadata = new grpc.Metadata();
        metadata.add('macaroon', macaroon);
        const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
            callback(null, metadata);
        });
        return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
    });
}
exports.loadProxyCredentials = loadProxyCredentials;
function loadProxyLightning(ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let macname;
            if (ownerPubkey && ownerPubkey.length === 66) {
                macname = ownerPubkey;
            }
            else {
                try {
                    macname = yield getProxyRootPubkey();
                }
                catch (e) {
                    //do nothing here
                }
            }
            const credentials = yield loadProxyCredentials(macname);
            const lnrpcDescriptor = (0, proto_1.loadProto)('rpc_proxy');
            const lnrpc = lnrpcDescriptor.lnrpc_proxy;
            return new lnrpc.Lightning(PROXY_LND_IP + ':' + config.proxy_lnd_port, credentials);
        }
        catch (e) {
            logger_1.sphinxLogger.error(`ERROR in loadProxyLightning ${e}`);
        }
    });
}
exports.loadProxyLightning = loadProxyLightning;
let proxyRootPubkey = '';
function getProxyRootPubkey() {
    return new Promise((resolve, reject) => {
        if (proxyRootPubkey) {
            resolve(proxyRootPubkey);
            return;
        }
        if (IS_CLN) {
            const credentials = Lightning.loadMtlsCredentials();
            const descriptor = (0, proto_1.loadProto)('cln/node');
            const cln = descriptor.cln;
            const options = {
                'grpc.ssl_target_name_override': 'cln',
            };
            const clnClient = new cln.Node(LND_IP + ':' + config.lnd_port, credentials, options);
            clnClient.getinfo({}, function (err, response) {
                if (response && err == null) {
                    const pubkey = Buffer.from(response.id).toString('hex');
                    proxyRootPubkey = pubkey;
                    resolve(proxyRootPubkey);
                }
                else {
                    reject(err);
                }
            });
        }
        else {
            // normal client, to get pubkey of LND or CLN
            const credentials = Lightning.loadCredentials();
            const lnrpcDescriptor = (0, proto_1.loadProto)('lightning');
            const lnrpc = lnrpcDescriptor.lnrpc;
            const lc = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
            lc.getInfo({}, function (err, response) {
                if (err == null && response) {
                    proxyRootPubkey = response.identity_pubkey;
                    resolve(proxyRootPubkey);
                }
                else {
                    reject('CANT GET ROOT KEY');
                }
            });
        }
    });
}
exports.getProxyRootPubkey = getProxyRootPubkey;
function getProxyLNDBalance() {
    return new Promise((resolve, reject) => {
        // normal client, to get pubkey of LND
        const credentials = Lightning.loadCredentials();
        const lnrpcDescriptor = (0, proto_1.loadProto)('lightning');
        const lnrpc = lnrpcDescriptor.lnrpc;
        const lc = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
        lc.channelBalance({}, function (err, response) {
            if (err == null && response) {
                lc.listChannels({}, function (err, channelList) {
                    if (err == null && channelList) {
                        const { channels } = channelList;
                        const reserve = channels.reduce((a, chan) => a + parseInt(chan.local_chan_reserve_sat), 0);
                        const balance = parseInt(response.balance) - reserve;
                        resolve(balance);
                    }
                    else {
                        reject(err);
                    }
                });
            }
            else {
                reject(err);
            }
        });
    });
}
function getProxyXpub() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield (0, node_fetch_1.default)(adminURL + 'origin_xpub', {
                method: 'GET',
                headers: { 'x-admin-token': config.proxy_admin_token },
            });
            const j = yield r.json();
            return j;
        }
        catch (e) {
            console.log(e);
            throw e;
        }
    });
}
exports.getProxyXpub = getProxyXpub;
//# sourceMappingURL=proxy.js.map