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
exports.decodePayReq = exports.sendPayment = exports.unlockWallet = exports.channelBalance = exports.getChanInfo = exports.listChannels = exports.queryRoute = exports.listAllPaymentsFull = exports.listAllInvoices = exports.getInfo = exports.listAllPayments = exports.listInvoices = exports.SPHINX_CUSTOM_RECORD_KEY = exports.LND_KEYSEND_KEY = exports.signBuffer = exports.signAscii = exports.verifyBytes = exports.verifyAscii = exports.verifyMessage = exports.signMessage = exports.keysendMessage = exports.keysend = exports.getRoute = exports.setLock = exports.getLock = exports.getHeaders = exports.loadWalletUnlocker = exports.loadLightning = exports.loadCredentials = exports.openChannel = exports.connectPeer = exports.pendingChannels = exports.newAddress = exports.UNUSED_NESTED_PUBKEY_HASH = exports.UNUSED_WITNESS_PUBKEY_HASH = exports.NESTED_PUBKEY_HASH = exports.WITNESS_PUBKEY_HASH = void 0;
const ByteBuffer = require("bytebuffer");
const fs = require("fs");
const grpc = require("grpc");
const helpers_1 = require("../helpers");
const sha = require("js-sha256");
const crypto = require("crypto");
const constants_1 = require("../constants");
const macaroon_1 = require("../utils/macaroon");
const config_1 = require("../utils/config");
const proxy_1 = require("../utils/proxy");
const logger_1 = require("../utils/logger");
const interfaces = require("./interfaces");
// var protoLoader = require('@grpc/proto-loader')
const config = config_1.loadConfig();
const LND_IP = config.lnd_ip || 'localhost';
// const IS_LND = config.lightning_provider === "LND";
const IS_GREENLIGHT = config.lightning_provider === "GREENLIGHT";
const LND_KEYSEND_KEY = 5482373484;
exports.LND_KEYSEND_KEY = LND_KEYSEND_KEY;
const SPHINX_CUSTOM_RECORD_KEY = 133773310;
exports.SPHINX_CUSTOM_RECORD_KEY = SPHINX_CUSTOM_RECORD_KEY;
var lightningClient = null;
var walletUnlocker = null;
var routerClient = null;
const loadCredentials = (macName) => {
    var lndCert = fs.readFileSync(config.tls_location);
    var sslCreds = grpc.credentials.createSsl(lndCert);
    var macaroon = macaroon_1.getMacaroon(macName);
    var metadata = new grpc.Metadata();
    metadata.add('macaroon', macaroon);
    var macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
        callback(null, metadata);
    });
    return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
};
exports.loadCredentials = loadCredentials;
const loadGreenlightCredentials = () => {
    var glCert = fs.readFileSync(config.tls_location);
    var glPriv = fs.readFileSync(config.tls_key_location);
    var glChain = fs.readFileSync(config.tls_chain_location);
    return grpc.credentials.createSsl(glCert, glPriv, glChain);
};
function loadLightning(tryProxy, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        // only if specified AND available
        if (tryProxy && proxy_1.isProxy()) {
            const pl = yield proxy_1.loadProxyLightning(ownerPubkey);
            return pl;
        }
        if (lightningClient) {
            return lightningClient;
        }
        if (IS_GREENLIGHT) {
            var credentials = loadGreenlightCredentials();
            var descriptor = grpc.load("proto/greenlight.proto");
            var greenlight = descriptor.greenlight;
            var options = {
                'grpc.ssl_target_name_override': 'localhost',
            };
            lightningClient = new greenlight.Node(LND_IP + ':' + config.lnd_port, credentials, options);
            return lightningClient;
        }
        try { // LND
            var credentials = loadCredentials();
            var lnrpcDescriptor = grpc.load("proto/rpc.proto");
            var lnrpc = lnrpcDescriptor.lnrpc;
            lightningClient = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
            return lightningClient;
        }
        catch (e) {
            throw e;
        }
    });
}
exports.loadLightning = loadLightning;
const loadWalletUnlocker = () => {
    if (walletUnlocker) {
        return walletUnlocker;
    }
    else {
        var credentials = loadCredentials();
        try {
            var lnrpcDescriptor = grpc.load("proto/walletunlocker.proto");
            var lnrpc = lnrpcDescriptor.lnrpc;
            walletUnlocker = new lnrpc.WalletUnlocker(LND_IP + ':' + config.lnd_port, credentials);
            return walletUnlocker;
        }
        catch (e) {
            console.log(e);
        }
    }
};
exports.loadWalletUnlocker = loadWalletUnlocker;
const unlockWallet = (pwd) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(function (resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            let wu = yield loadWalletUnlocker();
            wu.unlockWallet({ wallet_password: ByteBuffer.fromUTF8(pwd) }, (err, response) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(response);
            });
        });
    });
});
exports.unlockWallet = unlockWallet;
const getHeaders = (req) => {
    return {
        "X-User-Token": req.headers['x-user-token'],
        "X-User-Email": req.headers['x-user-email']
    };
};
exports.getHeaders = getHeaders;
var isLocked = false;
let lockTimeout;
const getLock = () => isLocked;
exports.getLock = getLock;
const setLock = (value) => {
    isLocked = value;
    console.log({ isLocked });
    if (lockTimeout)
        clearTimeout(lockTimeout);
    lockTimeout = setTimeout(() => {
        isLocked = false;
        console.log({ isLocked });
    }, 1000 * 60 * 2);
};
exports.setLock = setLock;
const getRoute = (pub_key, amt, route_hint, callback) => __awaiter(void 0, void 0, void 0, function* () {
    log('getRoute');
    let lightning = yield loadLightning(true); // try proxy
    const options = { pub_key, amt };
    if (route_hint && route_hint.includes(':')) {
        const arr = route_hint.split(':');
        const node_id = arr[0];
        const chan_id = arr[1];
        options.route_hints = [{
                hop_hints: [{ node_id, chan_id }]
            }];
    }
    lightning.queryRoutes(options, (err, response) => callback(err, response));
});
exports.getRoute = getRoute;
const queryRoute = (pub_key, amt, route_hint, ownerPubkey) => __awaiter(void 0, void 0, void 0, function* () {
    log('queryRoute');
    return new Promise(function (resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            let lightning = yield loadLightning(true, ownerPubkey); // try proxy
            const options = { pub_key, amt };
            if (route_hint && route_hint.includes(':')) {
                const arr = route_hint.split(':');
                const node_id = arr[0];
                const chan_id = arr[1];
                options.route_hints = [{
                        hop_hints: [{ node_id, chan_id }]
                    }];
            }
            lightning.queryRoutes(options, (err, response) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(response);
            });
        });
    });
});
exports.queryRoute = queryRoute;
const decodePayReq = (pay_req) => __awaiter(void 0, void 0, void 0, function* () {
    log('decodePayReq');
    return new Promise(function (resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            let lightning = yield loadLightning();
            lightning.decodePayReq({ pay_req }, (err, response) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(response);
            });
        });
    });
});
exports.decodePayReq = decodePayReq;
exports.WITNESS_PUBKEY_HASH = 0;
exports.NESTED_PUBKEY_HASH = 1;
exports.UNUSED_WITNESS_PUBKEY_HASH = 2;
exports.UNUSED_NESTED_PUBKEY_HASH = 3;
function newAddress(type = exports.NESTED_PUBKEY_HASH) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            return __awaiter(this, void 0, void 0, function* () {
                let lightning = yield loadLightning();
                lightning.newAddress({ type }, (err, response) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!(response && response.address)) {
                        reject('no address');
                        return;
                    }
                    resolve(response.address);
                });
            });
        });
    });
}
exports.newAddress = newAddress;
// for payingn invoice and invite invoice
function sendPayment(payment_request, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        log('sendPayment');
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let lightning = yield loadLightning(true, ownerPubkey); // try proxy
            if (proxy_1.isProxy()) {
                lightning.sendPaymentSync({ payment_request }, (err, response) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        if (response.payment_error) {
                            reject(response.payment_error);
                        }
                        else {
                            resolve(response);
                        }
                    }
                });
            }
            else {
                var call = lightning.sendPayment({});
                call.on('data', (response) => __awaiter(this, void 0, void 0, function* () {
                    if (response.payment_error) {
                        reject(response.payment_error);
                    }
                    else {
                        resolve(response);
                    }
                }));
                call.on('error', (err) => __awaiter(this, void 0, void 0, function* () {
                    reject(err);
                }));
                call.write({ payment_request });
            }
        }));
    });
}
exports.sendPayment = sendPayment;
const keysend = (opts, ownerPubkey) => {
    log('keysend');
    return new Promise(function (resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const FEE_LIMIT_SAT = 10;
                const randoStr = crypto.randomBytes(32).toString('hex');
                const preimage = ByteBuffer.fromHex(randoStr);
                const options = {
                    amt: Math.max(opts.amt, constants_1.default.min_sat_amount || 3),
                    final_cltv_delta: 10,
                    dest: ByteBuffer.fromHex(opts.dest),
                    dest_custom_records: {
                        [`${LND_KEYSEND_KEY}`]: preimage,
                        [`${SPHINX_CUSTOM_RECORD_KEY}`]: ByteBuffer.fromUTF8(opts.data),
                    },
                    payment_hash: sha.sha256.arrayBuffer(preimage.toBuffer()),
                    dest_features: [9],
                };
                // add in route hints
                if (opts.route_hint && opts.route_hint.includes(':')) {
                    const arr = opts.route_hint.split(':');
                    const node_id = arr[0];
                    const chan_id = arr[1];
                    options.route_hints = [{
                            hop_hints: [{ node_id, chan_id }]
                        }];
                }
                // sphinx-proxy sendPaymentSync
                if (proxy_1.isProxy()) {
                    // console.log("SEND sendPaymentSync", options)
                    options.fee_limit = { fixed: FEE_LIMIT_SAT };
                    let lightning = yield loadLightning(true, ownerPubkey); // try proxy
                    lightning.sendPaymentSync(options, (err, response) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            if (response.payment_error) {
                                reject(response.payment_error);
                            }
                            else {
                                resolve(response);
                            }
                        }
                    });
                }
                else {
                    // console.log("SEND sendPaymentV2", options)
                    // new sendPayment (with optional route hints)
                    options.fee_limit_sat = FEE_LIMIT_SAT;
                    options.timeout_seconds = 16;
                    const router = yield loadRouter();
                    const call = router.sendPaymentV2(options);
                    call.on('data', function (payment) {
                        const state = payment.status || payment.state;
                        if (payment.payment_error) {
                            reject(payment.payment_error);
                        }
                        else {
                            if (state === 'IN_FLIGHT') {
                            }
                            else if (state === 'FAILED_NO_ROUTE') {
                                reject(payment.failure_reason || payment);
                            }
                            else if (state === 'FAILED') {
                                reject(payment.failure_reason || payment);
                            }
                            else if (state === 'SUCCEEDED') {
                                resolve(payment);
                            }
                        }
                    });
                    call.on('error', function (err) {
                        reject(err);
                    });
                    // call.write(options)
                }
            }
            catch (e) {
                reject(e);
            }
        });
    });
};
exports.keysend = keysend;
const loadRouter = () => {
    if (routerClient) {
        return routerClient;
    }
    else {
        try {
            var credentials = loadCredentials('router.macaroon');
            var descriptor = grpc.load("proto/router.proto");
            var router = descriptor.routerrpc;
            routerClient = new router.Router(LND_IP + ':' + config.lnd_port, credentials);
            return routerClient;
        }
        catch (e) {
            throw e;
        }
    }
};
const MAX_MSG_LENGTH = 972; // 1146 - 20 ???
function keysendMessage(opts, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        log('keysendMessage');
        return new Promise(function (resolve, reject) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!opts.data || typeof opts.data !== 'string') {
                    return reject('string plz');
                }
                if (opts.data.length < MAX_MSG_LENGTH) {
                    try {
                        const res = yield keysend(opts, ownerPubkey);
                        resolve(res);
                    }
                    catch (e) {
                        reject(e);
                    }
                    return;
                }
                // too long! need to send serial
                const n = Math.ceil(opts.data.length / MAX_MSG_LENGTH);
                let success = false;
                let fail = false;
                let res = null;
                const ts = new Date().valueOf();
                // WEAVE MESSAGE If TOO LARGE
                yield asyncForEach(Array.from(Array(n)), (u, i) => __awaiter(this, void 0, void 0, function* () {
                    const spliti = Math.ceil(opts.data.length / n);
                    const m = opts.data.substr(i * spliti, spliti);
                    const isLastThread = i === n - 1;
                    const amt = isLastThread ? opts.amt : constants_1.default.min_sat_amount;
                    try {
                        res = yield keysend(Object.assign(Object.assign({}, opts), { amt, data: `${ts}_${i}_${n}_${m}` }), ownerPubkey);
                        success = true;
                        yield helpers_1.sleep(432);
                    }
                    catch (e) {
                        console.log(e);
                        fail = true;
                    }
                }));
                if (success && !fail) {
                    resolve(res);
                }
                else {
                    reject(new Error('fail'));
                }
            });
        });
    });
}
exports.keysendMessage = keysendMessage;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
function signAscii(ascii, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sig = yield signMessage(ascii_to_hexa(ascii), ownerPubkey);
            return sig;
        }
        catch (e) {
            throw e;
        }
    });
}
exports.signAscii = signAscii;
function listInvoices() {
    log('listInvoices');
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const lightning = yield loadLightning();
        lightning.listInvoices({
            num_max_invoices: 100000,
            reversed: true,
        }, (err, response) => {
            if (!err) {
                resolve(response);
            }
            else {
                reject(err);
            }
        });
    }));
}
exports.listInvoices = listInvoices;
function listAllInvoices() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=> list all invoices');
        const invs = yield paginateInvoices(40);
        return invs;
    });
}
exports.listAllInvoices = listAllInvoices;
function paginateInvoices(limit, i = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield listInvoicesPaginated(limit, i);
            const lastOffset = parseInt(r.first_index_offset);
            if (lastOffset > 0) {
                return r.invoices.concat(yield paginateInvoices(limit, lastOffset));
            }
            return r.invoices;
        }
        catch (e) {
            return [];
        }
    });
}
function listInvoicesPaginated(limit, offset) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const lightning = yield loadLightning();
        lightning.listInvoices({
            num_max_invoices: limit,
            index_offset: offset,
            reversed: true,
        }, (err, response) => {
            if (!err && response && response.invoices)
                resolve(response);
            else
                reject(err);
        });
    }));
}
// need to upgrade to .10 for this
function listAllPayments() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("=> list all payments");
        const pays = yield paginatePayments(40); // max num
        console.log('pays', pays && pays.length);
        return pays;
    });
}
exports.listAllPayments = listAllPayments;
function paginatePayments(limit, i = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield listPaymentsPaginated(limit, i);
            const lastOffset = parseInt(r.first_index_offset); // this is "first" cuz its in reverse (lowest index)
            if (lastOffset > 0) {
                return r.payments.concat(yield paginatePayments(limit, lastOffset));
            }
            return r.payments;
        }
        catch (e) {
            return [];
        }
    });
}
function listPaymentsPaginated(limit, offset) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const lightning = yield loadLightning();
        lightning.listPayments({
            max_payments: limit,
            index_offset: offset,
            reversed: true,
        }, (err, response) => {
            if (!err && response && response.payments)
                resolve(response);
            else
                reject(err);
        });
    }));
}
function listAllPaymentsFull() {
    console.log('=> list all payments');
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const lightning = yield loadLightning();
        lightning.listPayments({}, (err, response) => {
            if (!err && response && response.payments) {
                resolve(response.payments);
            }
            else {
                reject(err);
            }
        });
    }));
}
exports.listAllPaymentsFull = listAllPaymentsFull;
const signMessage = (msg, ownerPubkey) => {
    // log('signMessage')
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let lightning = yield loadLightning(true, ownerPubkey); // try proxy
        try {
            const options = { msg: ByteBuffer.fromHex(msg) };
            lightning.signMessage(options, function (err, sig) {
                if (err || !sig.signature) {
                    reject(err);
                }
                else {
                    resolve(sig.signature);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    }));
};
exports.signMessage = signMessage;
const signBuffer = (msg, ownerPubkey) => {
    log('signBuffer');
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let lightning = yield loadLightning(true, ownerPubkey); // try proxy
            const options = { msg };
            lightning.signMessage(options, function (err, sig) {
                if (err || !sig.signature) {
                    reject(err);
                }
                else {
                    resolve(sig.signature);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    }));
};
exports.signBuffer = signBuffer;
function verifyBytes(msg, sig) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield verifyMessage(msg.toString('hex'), sig);
            return r;
        }
        catch (e) {
            throw e;
        }
    });
}
exports.verifyBytes = verifyBytes;
function verifyMessage(msg, sig, ownerPubkey) {
    log('verifyMessage');
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            let lightning = yield loadLightning(true, ownerPubkey); // try proxy
            const options = {
                msg: ByteBuffer.fromHex(msg),
                signature: sig,
            };
            lightning.verifyMessage(options, function (err, res) {
                if (err || !res.pubkey) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    }));
}
exports.verifyMessage = verifyMessage;
function verifyAscii(ascii, sig, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield verifyMessage(ascii_to_hexa(ascii), sig, ownerPubkey);
            return r;
        }
        catch (e) {
            throw e;
        }
    });
}
exports.verifyAscii = verifyAscii;
function getInfo(tryProxy) {
    return __awaiter(this, void 0, void 0, function* () {
        // log('getInfo')
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const lightning = yield loadLightning(tryProxy === false ? false : true); // try proxy
            lightning.getInfo({}, function (err, response) {
                if (err == null) {
                    resolve(interfaces.getInfoResponse(response));
                }
                else {
                    reject(err);
                }
            });
        }));
    });
}
exports.getInfo = getInfo;
function listChannels(args, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        log('listChannels');
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const lightning = yield loadLightning(true, ownerPubkey); // try proxy
            const cmd = interfaces.listChannelsCommand();
            const opts = interfaces.listChannelsRequest(args);
            lightning[cmd](opts, function (err, response) {
                if (err == null) {
                    resolve(interfaces.listChannelsResponse(response));
                }
                else {
                    reject(err);
                }
            });
        }));
    });
}
exports.listChannels = listChannels;
function pendingChannels(ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        log('pendingChannels');
        if (IS_GREENLIGHT)
            return [];
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const lightning = yield loadLightning(true, ownerPubkey); // try proxy
            lightning.pendingChannels({}, function (err, response) {
                if (err == null) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        }));
    });
}
exports.pendingChannels = pendingChannels;
function connectPeer(args) {
    return __awaiter(this, void 0, void 0, function* () {
        log('connectPeer');
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const lightning = yield loadLightning();
            lightning.connectPeer(args, function (err, response) {
                if (err == null) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        }));
    });
}
exports.connectPeer = connectPeer;
function openChannel(args) {
    return __awaiter(this, void 0, void 0, function* () {
        log('openChannel');
        const opts = args || {};
        if (args && args.node_pubkey) {
            opts.node_pubkey = ByteBuffer.fromHex(args.node_pubkey);
        }
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const lightning = yield loadLightning();
            lightning.openChannelSync(opts, function (err, response) {
                if (err == null) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        }));
    });
}
exports.openChannel = openChannel;
function channelBalance(ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        log('channelBalance');
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const lightning = yield loadLightning(true, ownerPubkey); // try proxy
            lightning.channelBalance({}, function (err, response) {
                if (err == null) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        }));
    });
}
exports.channelBalance = channelBalance;
function getChanInfo(chan_id, tryProxy) {
    return __awaiter(this, void 0, void 0, function* () {
        // log('getChanInfo')
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (!chan_id) {
                return reject('no chan id');
            }
            const lightning = yield loadLightning(tryProxy === false ? false : true); // try proxy
            lightning.getChanInfo({ chan_id }, function (err, response) {
                if (err == null) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        }));
    });
}
exports.getChanInfo = getChanInfo;
function ascii_to_hexa(str) {
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n++) {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}
// async function loadLightningNew() {
//   if (lightningClient) {
//     return lightningClient
//   } else {
//   	var credentials = loadCredentials()
//     const packageDefinition = await protoLoader.load("rpc.proto", {})
//     const lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
//     var { lnrpc } = lnrpcDescriptor;
//     lightningClient = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
//     return lightningClient
//   }
// }
let yeslog = logger_1.logging.Lightning;
function log(a, b, c) {
    if (!yeslog)
        return;
    console.log("[lightning]", [...arguments]);
}
//# sourceMappingURL=lightning.js.map