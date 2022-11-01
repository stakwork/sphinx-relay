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
exports.getChanInfo = exports.channelBalance = exports.complexBalances = exports.openChannel = exports.connectPeer = exports.pendingChannels = exports.listChannels = exports.listPeers = exports.addInvoice = exports.getInfo = exports.verifyAscii = exports.verifyMessage = exports.verifyBytes = exports.signBuffer = exports.signMessage = exports.listAllPaymentsFull = exports.listPaymentsPaginated = exports.listAllPayments = exports.listAllInvoices = exports.listInvoices = exports.signAscii = exports.keysendMessage = exports.loadRouter = exports.keysend = exports.sendPayment = exports.newAddress = exports.UNUSED_NESTED_PUBKEY_HASH = exports.UNUSED_WITNESS_PUBKEY_HASH = exports.NESTED_PUBKEY_HASH = exports.WITNESS_PUBKEY_HASH = exports.queryRoute = exports.setLock = exports.getLock = exports.getHeaders = exports.unlockWallet = exports.loadWalletUnlocker = exports.loadLightning = exports.loadCredentials = exports.SPHINX_CUSTOM_RECORD_KEY = exports.LND_KEYSEND_KEY = void 0;
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
const zbase32 = require("../utils/zbase32");
const secp256k1 = require("secp256k1");
const libhsmd_1 = require("./libhsmd");
const greenlight_1 = require("./greenlight");
// var protoLoader = require('@grpc/proto-loader')
const config = config_1.loadConfig();
const LND_IP = config.lnd_ip || 'localhost';
// const IS_LND = config.lightning_provider === "LND";
const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT';
exports.LND_KEYSEND_KEY = 5482373484;
exports.SPHINX_CUSTOM_RECORD_KEY = 133773310;
const FEE_LIMIT_SAT = 10000;
let lightningClient = null;
let walletUnlocker = null;
let routerClient = null;
function loadCredentials(macName) {
    try {
        const lndCert = fs.readFileSync(config.tls_location);
        const sslCreds = grpc.credentials.createSsl(lndCert);
        const macaroon = macaroon_1.getMacaroon(macName);
        const metadata = new grpc.Metadata();
        metadata.add('macaroon', macaroon);
        const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
            callback(null, metadata);
        });
        return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
    }
    catch (e) {
        // console.log(e)
        throw 'cannot read LND macaroon or cert';
    }
}
exports.loadCredentials = loadCredentials;
const loadGreenlightCredentials = () => {
    const glCert = fs.readFileSync(config.tls_location);
    const glPriv = fs.readFileSync(config.tls_key_location);
    const glChain = fs.readFileSync(config.tls_chain_location);
    return grpc.credentials.createSsl(glCert, glPriv, glChain);
};
function loadLightning(tryProxy, ownerPubkey, noCache) {
    return __awaiter(this, void 0, void 0, function* () {
        // only if specified AND available
        if (tryProxy && proxy_1.isProxy() && ownerPubkey) {
            const pl = yield proxy_1.loadProxyLightning(ownerPubkey);
            return pl;
        }
        if (lightningClient && !noCache) {
            return lightningClient;
        }
        if (IS_GREENLIGHT) {
            const credentials = loadGreenlightCredentials();
            const descriptor = grpc.load('proto/greenlight.proto');
            const greenlight = descriptor.greenlight;
            const options = {
                'grpc.ssl_target_name_override': 'localhost',
            };
            const uri = greenlight_1.get_greenlight_grpc_uri().split('//');
            if (!uri[1])
                return;
            lightningClient = new greenlight.Node(uri[1], credentials, options);
            return lightningClient;
        }
        // LND
        const credentials = loadCredentials();
        const lnrpcDescriptor = grpc.load('proto/lightning.proto');
        const lnrpc = lnrpcDescriptor.lnrpc;
        lightningClient = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
        return lightningClient;
    });
}
exports.loadLightning = loadLightning;
function loadWalletUnlocker() {
    if (walletUnlocker) {
        return walletUnlocker;
    }
    else {
        try {
            const credentials = loadCredentials();
            const lnrpcDescriptor = grpc.load('proto/walletunlocker.proto');
            const lnrpc = lnrpcDescriptor.lnrpc;
            walletUnlocker = new lnrpc.WalletUnlocker(LND_IP + ':' + config.lnd_port, credentials);
            return walletUnlocker;
        }
        catch (e) {
            logger_1.sphinxLogger.error(e);
        }
    }
}
exports.loadWalletUnlocker = loadWalletUnlocker;
function unlockWallet(pwd) {
    return new Promise(function (resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            const wu = yield loadWalletUnlocker();
            wu.unlockWallet({ wallet_password: ByteBuffer.fromUTF8(pwd) }, (err, response) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(response);
            });
        });
    });
}
exports.unlockWallet = unlockWallet;
function getHeaders(req) {
    return {
        'X-User-Token': req.headers['x-user-token'],
        'X-User-Email': req.headers['x-user-email'],
    };
}
exports.getHeaders = getHeaders;
let isLocked = false;
let lockTimeout;
function getLock() {
    return isLocked;
}
exports.getLock = getLock;
function setLock(value) {
    isLocked = value;
    logger_1.sphinxLogger.info({ isLocked });
    if (lockTimeout)
        clearTimeout(lockTimeout);
    lockTimeout = setTimeout(() => {
        isLocked = false;
        logger_1.sphinxLogger.info({ isLocked });
    }, 1000 * 60 * 2);
}
exports.setLock = setLock;
function queryRoute(pub_key, amt, route_hint, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('queryRoute', logger_1.logging.Lightning);
        if (IS_GREENLIGHT) {
            // shim for now
            return {
                success_prob: 1,
                routes: [],
            };
        }
        const lightning = yield loadLightning(true, ownerPubkey); // try proxy
        return new Promise((resolve, reject) => {
            const options = { pub_key, amt };
            if (route_hint && route_hint.includes(':')) {
                const arr = route_hint.split(':');
                const node_id = arr[0];
                const chan_id = arr[1];
                options.route_hints = [
                    {
                        hop_hints: [{ node_id, chan_id }],
                    },
                ];
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
}
exports.queryRoute = queryRoute;
exports.WITNESS_PUBKEY_HASH = 0;
exports.NESTED_PUBKEY_HASH = 1;
exports.UNUSED_WITNESS_PUBKEY_HASH = 2;
exports.UNUSED_NESTED_PUBKEY_HASH = 3;
function newAddress(type = exports.NESTED_PUBKEY_HASH) {
    return __awaiter(this, void 0, void 0, function* () {
        const lightning = yield loadLightning();
        return new Promise((resolve, reject) => {
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
}
exports.newAddress = newAddress;
// for paying invoice and invite invoice
function sendPayment(payment_request, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('sendPayment', logger_1.logging.Lightning);
        const lightning = yield loadLightning(true, ownerPubkey); // try proxy
        return new Promise((resolve, reject) => {
            if (proxy_1.isProxy()) {
                const opts = {
                    payment_request,
                    fee_limit: { fixed: FEE_LIMIT_SAT },
                };
                lightning.sendPaymentSync(opts, (err, response) => {
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
                if (IS_GREENLIGHT) {
                    lightning.pay({
                        bolt11: payment_request,
                        timeout: 12,
                    }, (err, response) => {
                        if (err == null) {
                            resolve(interfaces.keysendResponse(response));
                        }
                        else {
                            reject(err);
                        }
                    });
                }
                else {
                    const call = lightning.sendPayment({ payment_request });
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
            }
        });
    });
}
exports.sendPayment = sendPayment;
function keysend(opts, ownerPubkey) {
    logger_1.sphinxLogger.info('keysend', logger_1.logging.Lightning);
    return new Promise(function (resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const preimage = ByteBuffer.wrap(crypto.randomBytes(32));
                const dest_custom_records = {
                    [`${exports.LND_KEYSEND_KEY}`]: preimage,
                };
                if (opts.extra_tlv) {
                    Object.entries(opts.extra_tlv).forEach(([k, v]) => {
                        dest_custom_records[k] = ByteBuffer.fromUTF8(v);
                    });
                }
                const options = {
                    amt: Math.max(opts.amt, constants_1.default.min_sat_amount || 3),
                    final_cltv_delta: 10,
                    dest: ByteBuffer.fromHex(opts.dest),
                    dest_custom_records,
                    payment_hash: sha.sha256.arrayBuffer(preimage.toBuffer()),
                    dest_features: [9],
                };
                if (opts.data) {
                    options.dest_custom_records[`${exports.SPHINX_CUSTOM_RECORD_KEY}`] =
                        ByteBuffer.fromUTF8(opts.data);
                }
                // add in route hints
                if (opts.route_hint && opts.route_hint.includes(':')) {
                    const arr = opts.route_hint.split(':');
                    const node_id = arr[0];
                    const chan_id = arr[1];
                    options.route_hints = [
                        {
                            hop_hints: [{ node_id, chan_id }],
                        },
                    ];
                }
                // sphinx-proxy sendPaymentSync
                if (proxy_1.isProxy()) {
                    // console.log("SEND sendPaymentSync", options)
                    options.fee_limit = { fixed: FEE_LIMIT_SAT };
                    const lightning = yield loadLightning(true, ownerPubkey); // try proxy
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
                    if (IS_GREENLIGHT) {
                        const lightning = yield loadLightning(false, ownerPubkey);
                        const req = interfaces.keysendRequest(options);
                        // console.log("KEYSEND REQ", JSON.stringify(req))
                        lightning.keysend(req, function (err, response) {
                            if (err == null) {
                                resolve(interfaces.keysendResponse(response));
                            }
                            else {
                                reject(err);
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
                                    // do nothing
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
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
exports.keysend = keysend;
function loadRouter() {
    if (routerClient) {
        return routerClient;
    }
    else {
        const credentials = loadCredentials('router.macaroon');
        const descriptor = grpc.load('proto/router.proto');
        const router = descriptor.routerrpc;
        routerClient = new router.Router(LND_IP + ':' + config.lnd_port, credentials);
        return routerClient;
    }
}
exports.loadRouter = loadRouter;
const MAX_MSG_LENGTH = 972; // 1146 - 20 ???
function keysendMessage(opts, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('keysendMessage', logger_1.logging.Lightning);
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
                for (let i = 0; i < n; i++) {
                    const spliti = Math.ceil((opts.data || '').length / n);
                    const m = (opts.data || '').substring(i * spliti, i * spliti + spliti);
                    const isLastThread = i === n - 1;
                    const amt = isLastThread ? opts.amt : constants_1.default.min_sat_amount;
                    try {
                        res = yield keysend(Object.assign(Object.assign({}, opts), { amt, data: `${ts}_${i}_${n}_${m}` }), ownerPubkey);
                        success = true;
                        yield helpers_1.sleep(432);
                    }
                    catch (e) {
                        logger_1.sphinxLogger.error(e);
                        fail = true;
                    }
                }
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
function signAscii(ascii, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const sig = yield signMessage(ascii_to_hexa(ascii), ownerPubkey);
        return sig;
    });
}
exports.signAscii = signAscii;
function listInvoices() {
    logger_1.sphinxLogger.info('listInvoices', logger_1.logging.Lightning);
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
        logger_1.sphinxLogger.info(`=> list all invoices`);
        return paginateInvoices(40);
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
        logger_1.sphinxLogger.info('=> list all payments');
        const pays = yield paginatePayments(40); // max num
        logger_1.sphinxLogger.info(`pays ${pays && pays.length}`);
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
exports.listPaymentsPaginated = listPaymentsPaginated;
function listAllPaymentsFull() {
    logger_1.sphinxLogger.info('=> list all payments');
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
// msg is hex
function signMessage(msg, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        return signBuffer(Buffer.from(msg, 'hex'), ownerPubkey);
    });
}
exports.signMessage = signMessage;
function signBuffer(msg, ownerPubkey) {
    logger_1.sphinxLogger.info('signBuffer', logger_1.logging.Lightning);
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (IS_GREENLIGHT) {
                const pld = interfaces.greenlightSignMessagePayload(msg);
                const sig = libhsmd_1.default.Handle(1024, 0, null, pld);
                const sigBuf = Buffer.from(sig, 'hex');
                const sigBytes = sigBuf.subarray(2, 66);
                const recidBytes = sigBuf.subarray(66, 67);
                // 31 is the magic EC recid (27+4) for compressed pubkeys
                const ecRecid = Buffer.from(recidBytes).readUIntBE(0, 1) + 31;
                const finalRecid = Buffer.allocUnsafe(1);
                finalRecid.writeUInt8(ecRecid, 0);
                const finalSig = Buffer.concat([finalRecid, sigBytes], 65);
                resolve(zbase32.encode(finalSig));
            }
            else {
                const lightning = yield loadLightning(true, ownerPubkey); // try proxy
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
        }
        catch (e) {
            reject(e);
        }
    }));
}
exports.signBuffer = signBuffer;
function verifyBytes(msg, sig) {
    return __awaiter(this, void 0, void 0, function* () {
        const r = yield verifyMessage(msg.toString('hex'), sig);
        return r;
    });
}
exports.verifyBytes = verifyBytes;
// msg input is hex encoded, sig is zbase32 encoded
function verifyMessage(msg, sig, ownerPubkey) {
    logger_1.sphinxLogger.info('verifyMessage', logger_1.logging.Lightning);
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (IS_GREENLIGHT) {
                const fullBytes = zbase32.decode(sig);
                const sigBytes = fullBytes.slice(1);
                const recidBytes = fullBytes.slice(0, 1);
                // 31 (27+4) is the magic number for compressed recid
                const recid = Buffer.from(recidBytes).readUIntBE(0, 1) - 31;
                // "Lightning Signed Message:"
                const prefixBytes = Buffer.from('4c696768746e696e67205369676e6564204d6573736167653a', 'hex');
                const msgBytes = Buffer.from(msg, 'hex');
                // double hash
                const hash = sha.sha256.arrayBuffer(sha.sha256.arrayBuffer(Buffer.concat([prefixBytes, msgBytes], msgBytes.length + prefixBytes.length)));
                const recoveredPubkey = secp256k1.recover(Buffer.from(hash), // 32 byte hash of message
                sigBytes, // 64 byte signature of message (not DER, 32 byte R and 32 byte S with 0x00 padding)
                recid, // number 1 or 0. This will usually be encoded in the base64 message signature
                true // true if you want result to be compressed (33 bytes), false if you want it uncompressed (65 bytes) this also is usually encoded in the base64 signature
                );
                resolve({
                    valid: true,
                    pubkey: recoveredPubkey.toString('hex'),
                });
            }
            else {
                const lightning = yield loadLightning(true, ownerPubkey); // try proxy
                const options = {
                    msg: ByteBuffer.fromHex(msg),
                    signature: sig, // zbase32 encoded string
                };
                lightning.verifyMessage(options, function (err, res) {
                    // console.log(res)
                    if (err || !res.pubkey) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            }
        }
        catch (e) {
            reject(e);
        }
    }));
}
exports.verifyMessage = verifyMessage;
function verifyAscii(ascii, sig, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const r = yield verifyMessage(ascii_to_hexa(ascii), sig, ownerPubkey);
        return r;
    });
}
exports.verifyAscii = verifyAscii;
function getInfo(tryProxy, noCache) {
    return __awaiter(this, void 0, void 0, function* () {
        // log('getInfo')
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const lightning = yield loadLightning(tryProxy === false ? false : true, undefined, noCache); // try proxy
                lightning.getInfo({}, function (err, response) {
                    if (err == null) {
                        resolve(interfaces.getInfoResponse(response));
                    }
                    else {
                        reject(err);
                    }
                });
            }
            catch (e) {
                reject(e);
            }
        }));
    });
}
exports.getInfo = getInfo;
function addInvoice(request, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        // log('addInvoice')
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const lightning = yield loadLightning(true, ownerPubkey); // try proxy
            const cmd = interfaces.addInvoiceCommand();
            const req = interfaces.addInvoiceRequest(request);
            lightning[cmd](req, function (err, response) {
                if (err == null) {
                    resolve(interfaces.addInvoiceResponse(response));
                }
                else {
                    reject(err);
                }
            });
        }));
    });
}
exports.addInvoice = addInvoice;
function listPeers(args, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('listChannels', logger_1.logging.Lightning);
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const lightning = yield loadLightning(true, ownerPubkey);
            const opts = interfaces.listPeersRequest(args);
            lightning.listPeers(opts, function (err, response) {
                if (err == null) {
                    resolve(interfaces.listPeersResponse(response));
                }
                else {
                    reject(err);
                }
            });
        }));
    });
}
exports.listPeers = listPeers;
function listChannels(args, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('listChannels', logger_1.logging.Lightning);
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
        logger_1.sphinxLogger.info('pendingChannels', logger_1.logging.Lightning);
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
        logger_1.sphinxLogger.info('connectPeer', logger_1.logging.Lightning);
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const lightning = yield loadLightning();
            const req = interfaces.connectPeerRequest(args);
            lightning.connectPeer(req, function (err, response) {
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
        logger_1.sphinxLogger.info('openChannel', logger_1.logging.Lightning);
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
function complexBalances(ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('complexBalances', logger_1.logging.Lightning);
        const channelList = yield listChannels({}, ownerPubkey);
        const { channels } = channelList;
        if (IS_GREENLIGHT) {
            const local_balance = channels.reduce((a, chan) => a + parseInt(chan.local_balance), 0);
            return {
                reserve: 0,
                full_balance: Math.max(0, local_balance),
                balance: Math.max(0, local_balance),
                pending_open_balance: 0,
            };
        }
        else {
            const reserve = channels.reduce((a, chan) => a + parseInt(chan.local_chan_reserve_sat), 0);
            const spendableBalance = channels.reduce((a, chan) => a + Math.max(0, parseInt(chan.local_balance) - parseInt(chan.local_chan_reserve_sat)), 0);
            const response = yield channelBalance(ownerPubkey);
            return {
                reserve,
                full_balance: Math.max(0, parseInt(response.balance)),
                balance: spendableBalance,
                pending_open_balance: parseInt(response.pending_open_balance),
            };
        }
    });
}
exports.complexBalances = complexBalances;
function channelBalance(ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('channelBalance', logger_1.logging.Lightning);
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
        if (IS_GREENLIGHT)
            return {}; // skip for now
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
    const arr1 = [];
    for (let n = 0, l = str.length; n < l; n++) {
        const hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}
// async function loadLightningNew() {
//   if (lightningClient) {
//     return lightningClient
//   } else {
//   	var credentials = loadCredentials()
//     const packageDefinition = await protoLoader.load("lightning.proto", {})
//     const lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
//     var { lnrpc } = lnrpcDescriptor;
//     lightningClient = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
//     return lightningClient
//   }
// }
//# sourceMappingURL=lightning.js.map