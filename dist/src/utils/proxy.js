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
exports.getProxyRootPubkey = exports.loadProxyLightning = exports.loadProxyCredentials = exports.getProxyTotalBalance = exports.generateNewExternalUser = exports.generateNewUser = exports.generateNewUsers = exports.genUsersInterval = exports.isProxy = void 0;
const fs = require("fs");
const grpc = require("grpc");
const config_1 = require("./config");
const Lightning = require("../grpc/lightning");
const models_1 = require("../models");
const node_fetch_1 = require("node-fetch");
const logger_1 = require("./logger");
const helpers_1 = require("../helpers");
// var protoLoader = require('@grpc/proto-loader')
const config = (0, config_1.loadConfig)();
const LND_IP = config.lnd_ip || 'localhost';
const PROXY_LND_IP = config.proxy_lnd_ip || 'localhost';
const check_proxy_balance = false;
function isProxy() {
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
const SATS_PER_USER = config.proxy_initial_sats || 5000;
// isOwner users with no authToken
function generateNewUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isProxy()) {
            logger_1.sphinxLogger.error(`not proxy`, logger_1.logging.Proxy);
            return;
        }
        const newusers = yield models_1.models.Contact.findAll({
            where: { isOwner: true, authToken: null },
        });
        if (newusers.length >= NEW_USER_NUM) {
            logger_1.sphinxLogger.error(`already have new users`, logger_1.logging.Proxy);
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
        yield asyncForEach(arr, () => __awaiter(this, void 0, void 0, function* () {
            yield generateNewUser(rootpk);
        }));
    });
}
exports.generateNewUsers = generateNewUsers;
const adminURL = config.proxy_admin_url
    ? config.proxy_admin_url + '/'
    : 'http://localhost:5555/';
function generateNewUser(rootpk) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield (0, node_fetch_1.default)(adminURL + 'generate', {
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
            const created = yield models_1.models.Contact.create(contact);
            // set tenant to self!
            created.update({ tenant: created.id });
            logger_1.sphinxLogger.info(`=> CREATED OWNER: ${created.dataValues.publicKey}`);
        }
        catch (e) {
            logger_1.sphinxLogger.error(`=> could not gen new user ${e}`);
        }
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
        for (let i = 0; i < 100 && fs.existsSync(config.proxy_tls_location); i++) {
            console.log('lndCert not found trying again:');
            yield (0, helpers_1.sleep)(1000);
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
            const lnrpcDescriptor = grpc.load('proto/rpc_proxy.proto');
            const lnrpc = lnrpcDescriptor.lnrpc_proxy;
            const the = new lnrpc.Lightning(PROXY_LND_IP + ':' + config.proxy_lnd_port, credentials);
            return the;
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
        // normal client, to get pubkey of LND
        const credentials = Lightning.loadCredentials();
        const lnrpcDescriptor = grpc.load('proto/lightning.proto');
        const lnrpc = lnrpcDescriptor.lnrpc;
        const lc = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
        lc.getInfo({}, function (err, response) {
            if (err == null) {
                proxyRootPubkey = response.identity_pubkey;
                resolve(proxyRootPubkey);
            }
            else {
                reject('CANT GET ROOT KEY');
            }
        });
    });
}
exports.getProxyRootPubkey = getProxyRootPubkey;
function getProxyLNDBalance() {
    return new Promise((resolve, reject) => {
        // normal client, to get pubkey of LND
        const credentials = Lightning.loadCredentials();
        const lnrpcDescriptor = grpc.load('proto/lightning.proto');
        const lnrpc = lnrpcDescriptor.lnrpc;
        const lc = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
        lc.channelBalance({}, function (err, response) {
            if (err == null) {
                lc.listChannels({}, function (err, channelList) {
                    if (err == null) {
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
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=proxy.js.map