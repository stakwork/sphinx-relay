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
exports.getInvoiceHandler = exports.getChanInfo = exports.channelBalance = exports.complexBalances = exports.openChannel = exports.connectPeer = exports.pendingChannels = exports.listChannels = exports.listPeers = exports.addInvoice = exports.getInfo = exports.verifyAscii = exports.verifyMessage = exports.verifyBytes = exports.signBuffer = exports.signMessage = exports.listAllPaymentsFull = exports.listPaymentsPaginated = exports.listAllPayments = exports.listAllInvoices = exports.listInvoices = exports.signAscii = exports.keysendMessage = exports.loadRouter = exports.keysend = exports.sendPayment = exports.newAddress = exports.UNUSED_NESTED_PUBKEY_HASH = exports.UNUSED_WITNESS_PUBKEY_HASH = exports.NESTED_PUBKEY_HASH = exports.WITNESS_PUBKEY_HASH = exports.queryRoute = exports.setLock = exports.getLock = exports.getHeaders = exports.unlockWallet = exports.loadWalletUnlocker = exports.loadLightning = exports.loadMtlsCredentials = exports.loadCredentials = exports.isCLN = exports.isGL = exports.isLND = exports.SPHINX_CUSTOM_RECORD_KEY = exports.LND_KEYSEND_KEY = void 0;
const fs = require("fs");
const grpc = require("@grpc/grpc-js");
const proto_1 = require("./proto");
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
const short = require("short-uuid");
const config = (0, config_1.loadConfig)();
const LND_IP = config.lnd_ip || 'localhost';
const IS_LND = config.lightning_provider === 'LND';
const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT';
const IS_CLN = config.lightning_provider === 'CLN';
exports.LND_KEYSEND_KEY = 5482373484;
exports.SPHINX_CUSTOM_RECORD_KEY = 133773310;
const FEE_LIMIT_SAT = 10000;
let lightningClient;
let walletUnlocker;
let routerClient;
// typescript helpers for types
function isLND(client) {
    return IS_LND;
}
exports.isLND = isLND;
function isGL(client) {
    return IS_GREENLIGHT;
}
exports.isGL = isGL;
function isCLN(client) {
    return IS_CLN;
}
exports.isCLN = isCLN;
function loadCredentials(macName) {
    try {
        // console.log('=> loadCredentials', macName)
        const lndCert = fs.readFileSync(config.tls_location);
        const sslCreds = grpc.credentials.createSsl(lndCert);
        const macaroon = (0, macaroon_1.getMacaroon)(macName);
        const metadata = new grpc.Metadata();
        metadata.add('macaroon', macaroon);
        const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
            callback(null, metadata);
        });
        return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
    }
    catch (e) {
        console.log('loadCredentials error', e);
        throw 'cannot read LND macaroon or cert';
    }
}
exports.loadCredentials = loadCredentials;
const loadMtlsCredentials = () => {
    const glCert = fs.readFileSync(config.cln_ca_cert);
    const glPriv = fs.readFileSync(config.cln_device_key);
    const glChain = fs.readFileSync(config.cln_device_cert);
    return grpc.credentials.createSsl(glCert, glPriv, glChain);
};
exports.loadMtlsCredentials = loadMtlsCredentials;
function loadLightning(tryProxy, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        // only if specified AND available
        if (tryProxy && (0, proxy_1.isProxy)() && ownerPubkey) {
            // do not cache proxy lightning
            const theLightningClient = yield (0, proxy_1.loadProxyLightning)(ownerPubkey);
            if (!theLightningClient) {
                throw new Error('no lightning client');
            }
            return theLightningClient;
        }
        if (lightningClient) {
            return lightningClient;
        }
        if (IS_GREENLIGHT) {
            const credentials = (0, exports.loadMtlsCredentials)();
            const descriptor = (0, proto_1.loadProto)('greenlight');
            const greenlight = descriptor.greenlight;
            const options = {
                'grpc.ssl_target_name_override': 'localhost',
            };
            const uri = (0, greenlight_1.get_greenlight_grpc_uri)().split('//');
            if (!uri[1]) {
                throw new Error('no lightning client');
            }
            return (lightningClient = new greenlight.Node(uri[1], credentials, options));
        }
        if (IS_CLN) {
            const credentials = (0, exports.loadMtlsCredentials)();
            const descriptor = (0, proto_1.loadProto)('cln/node');
            const cln = descriptor.cln;
            const options = {
                'grpc.ssl_target_name_override': 'cln',
            };
            return (lightningClient = new cln.Node(LND_IP + ':' + config.lnd_port, credentials, options));
        }
        // LND
        const credentials = loadCredentials();
        const lnrpcDescriptor = (0, proto_1.loadProto)('lightning');
        const lnrpc = lnrpcDescriptor.lnrpc;
        return (lightningClient = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials));
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
            const lnrpcDescriptor = (0, proto_1.loadProto)('walletunlocker');
            const lnrpc = lnrpcDescriptor.lnrpc;
            return (walletUnlocker = new lnrpc.WalletUnlocker(LND_IP + ':' + config.lnd_port, credentials));
        }
        catch (e) {
            logger_1.sphinxLogger.error(e);
            throw e;
        }
    }
}
exports.loadWalletUnlocker = loadWalletUnlocker;
function unlockWallet(pwd) {
    return new Promise(function (resolve, reject) {
        const wu = loadWalletUnlocker();
        wu.unlockWallet({ wallet_password: Buffer.from(pwd, 'utf-8') }, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
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
        const lightning = yield loadLightning(true, ownerPubkey); // try proxy
        if (isGL(lightning)) {
            // shim for now
            return {
                success_prob: 1,
                routes: [],
            };
        }
        return new Promise((resolve, reject) => {
            // need to manually add 3 block padding
            // which is done behind the scenes in SendPayment
            // https://github.com/lightningnetwork/lnd/issues/3421
            const final_cltv_delta = constants_1.default.final_cltv_delta + 3;
            const options = {
                pub_key,
                amt,
                final_cltv_delta,
            };
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
            // TODO remove any
            ;
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
            // TODO remove any
            ;
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
            if ((0, proxy_1.isProxy)(lightning)) {
                const opts = {
                    payment_request,
                    fee_limit: { fixed: FEE_LIMIT_SAT },
                };
                lightning.sendPaymentSync(opts, (err, response) => {
                    if (err || !response) {
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
                if (isGL(lightning)) {
                    lightning.pay({
                        bolt11: payment_request,
                        timeout: 12,
                    }, (err, response) => {
                        if (err == null && response) {
                            resolve(interfaces.keysendResponse(response));
                        }
                        else {
                            reject(err);
                        }
                    });
                }
                else if (isCLN(lightning)) {
                    lightning.pay({ bolt11: payment_request }, (err, response) => {
                        if (err == null && response) {
                            resolve(interfaces.keysendResponse(response));
                        }
                        else {
                            reject(err);
                        }
                    });
                }
                else {
                    const call = lightning.sendPayment();
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
            if (opts.dest.length !== 66) {
                return reject('keysend: invalid pubkey');
            }
            try {
                const preimage = crypto.randomBytes(32);
                const dest_custom_records = {
                    [`${exports.LND_KEYSEND_KEY}`]: preimage,
                };
                if (opts.extra_tlv) {
                    Object.entries(opts.extra_tlv).forEach(([k, v]) => {
                        dest_custom_records[k] = Buffer.from(v, 'utf-8');
                    });
                }
                if (opts.data) {
                    dest_custom_records[`${exports.SPHINX_CUSTOM_RECORD_KEY}`] = Buffer.from(opts.data, 'utf-8');
                }
                const options = {
                    amt: Math.max(opts.amt, constants_1.default.min_sat_amount || 3),
                    final_cltv_delta: constants_1.default.final_cltv_delta,
                    dest: Buffer.from(opts.dest, 'hex'),
                    dest_custom_records,
                    payment_hash: Buffer.from(sha.sha256.arrayBuffer(preimage)),
                    dest_features: [9],
                };
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
                const lightning = yield loadLightning(true, ownerPubkey); // try proxy
                if ((0, proxy_1.isProxy)(lightning)) {
                    // console.log("SEND sendPaymentSync", options)
                    options.fee_limit = { fixed: FEE_LIMIT_SAT };
                    lightning.sendPaymentSync(options, (err, response) => {
                        if (err || !response) {
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
                    const lightning = yield loadLightning(false, ownerPubkey);
                    if (isGL(lightning)) {
                        const req = (interfaces.keysendRequest(options));
                        // console.log("KEYSEND REQ", JSON.stringify(req))
                        // Type 'GreenlightRoutehint[]' is not assignable to type 'Routehint[]'
                        // from generated types:
                        // export interface Routehint {
                        //  hops?: {
                        //    node_id?: Buffer | Uint8Array | string
                        //    short_channel_id?: string
                        //    fee_base?: number | string | Long
                        //    fee_prop?: number
                        //    cltv_expiry_delta?: number
                        //  }[]
                        //}
                        lightning.keysend(req, function (err, response) {
                            if (err == null && response) {
                                // TODO greenlight type
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
                        const router = loadRouter();
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
        const descriptor = (0, proto_1.loadProto)('router');
        const router = descriptor.routerrpc;
        return (routerClient = new router.Router(LND_IP + ':' + config.lnd_port, credentials));
    }
}
exports.loadRouter = loadRouter;
const MAX_MSG_LENGTH = 972; // 1146 - 20 ???
function keysendMessage(opts, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('keysendMessage', logger_1.logging.Lightning);
        logger_1.sphinxLogger.info(`=> keysendMessage from ${ownerPubkey} ${JSON.stringify(opts, null, 2)}`, logger_1.logging.PaymentTracking);
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
                        yield (0, helpers_1.sleep)(432);
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
            const lightning = yield loadLightning(true, ownerPubkey); // try proxy
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
            else if (isLND(lightning) || (0, proxy_1.isProxy)(lightning)) {
                const options = { msg };
                lightning.signMessage(options, function (err, sig) {
                    if (err || !sig || !sig.signature) {
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
            const lightning = yield loadLightning(true, ownerPubkey); // try proxy
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
            else if (isLND(lightning) || (0, proxy_1.isProxy)(lightning)) {
                // sig is zbase32 encoded
                lightning.verifyMessage({
                    msg: Buffer.from(msg, 'hex'),
                    signature: sig,
                }, function (err, res) {
                    // console.log(res)
                    if (err || !res || !res.pubkey) {
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
function getInfo(tryProxy) {
    return __awaiter(this, void 0, void 0, function* () {
        // log('getInfo')
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                // try proxy
                const lightning = yield loadLightning(tryProxy === false ? false : true, undefined);
                // function finish(err, response: interfaces.GetInfoResponseType) {
                //   if (err == null) {
                //     resolve(interfaces.getInfoResponse(response))
                //   } else {
                //     reject(err)
                //   }
                // }
                if (isCLN(lightning)) {
                    lightning.getinfo({}, function (err, response) {
                        if (err == null) {
                            resolve(interfaces.getInfoResponse(response));
                        }
                        else {
                            reject(err);
                        }
                    });
                }
                else if (isGL(lightning)) {
                    lightning.getInfo({}, function (err, response) {
                        if (err == null) {
                            // FIXME?
                            resolve(interfaces.getInfoResponse(response));
                        }
                        else {
                            reject(err);
                        }
                    });
                }
                else {
                    lightning.getInfo({}, function (err, response) {
                        if (err == null) {
                            // FIXME?
                            resolve(interfaces.getInfoResponse(response));
                        }
                        else {
                            reject(err);
                        }
                    });
                }
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
            if (isLND(lightning) || (0, proxy_1.isProxy)(lightning)) {
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
            }
            else if (isCLN(lightning)) {
                const label = short.generate();
                lightning.invoice({
                    amount_msat: {
                        amount: { msat: convertToMsat(request.value) },
                    },
                    label,
                    description: request.memo,
                }, function (err, response) {
                    if (err == null) {
                        resolve({ payment_request: (response === null || response === void 0 ? void 0 : response.bolt11) || '' });
                    }
                    else {
                        logger_1.sphinxLogger.error([err], logger_1.logging.Lightning);
                        reject(err);
                    }
                });
            }
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
                if (err == null && response) {
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
            const opts = interfaces.listChannelsRequest(args);
            if (isGL(lightning)) {
                lightning.listPeers(opts, function (err, response) {
                    if (err == null && response) {
                        resolve(interfaces.listChannelsResponse(response));
                    }
                    else {
                        reject(err);
                    }
                });
            }
            else {
                // TODO remove any
                ;
                lightning.listChannels(opts, function (err, response) {
                    if (err == null && response) {
                        resolve(interfaces.listChannelsResponse(response));
                    }
                    else {
                        reject(err);
                    }
                });
            }
        }));
    });
}
exports.listChannels = listChannels;
// if separate fields get used in relay, it might be worth to add the types, just copy em from src/grpc/types with go to declaration of your ide
function pendingChannels(ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('pendingChannels', logger_1.logging.Lightning);
        const lightning = yield loadLightning(true, ownerPubkey); // try proxy
        const emptyChans = {
            total_limbo_balance: '0',
            pending_open_channels: [],
            pending_closing_channels: [],
            pending_force_closing_channels: [],
            waiting_close_channels: [],
        };
        if (isGL(lightning)) {
            return emptyChans;
        }
        if ((0, proxy_1.isProxy)()) {
            return emptyChans;
        }
        return new Promise((resolve, reject) => {
            // no pendingChannels on proxy??????
            ;
            lightning.pendingChannels({}, function (err, response) {
                if (err == null && response) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        });
    });
}
exports.pendingChannels = pendingChannels;
/** return void for LND, { node_id: string, features: string } for greenlight*/
function connectPeer(args) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('connectPeer', logger_1.logging.Lightning);
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const lightning = yield loadLightning();
            if (isGL(lightning)) {
                const req = interfaces.connectPeerRequest(args);
                lightning.connectPeer(req, function (err, response) {
                    if (err == null && response) {
                        resolve(response);
                    }
                    else {
                        reject(err);
                    }
                });
            }
            else if (isLND(lightning)) {
                lightning.connectPeer(args, function (err, response) {
                    if (err == null && response) {
                        resolve();
                    }
                    else {
                        reject(err);
                    }
                });
            }
        }));
    });
}
exports.connectPeer = connectPeer;
/** does nothing and returns nothing for greenlight */
function openChannel(args) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('openChannel', logger_1.logging.Lightning);
        const opts = args || {};
        const lightning = yield loadLightning();
        if (isGL(lightning)) {
            return;
        }
        if (isCLN(lightning)) {
            return; // FIXME
        }
        return new Promise((resolve, reject) => {
            lightning.openChannelSync(opts, function (err, response) {
                if (err == null && response) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        });
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
            const spendableBalance = channels.reduce((a, chan) => a +
                Math.max(0, parseInt(chan.local_balance) - parseInt(chan.local_chan_reserve_sat)), 0);
            const response = yield channelBalance(ownerPubkey);
            return {
                reserve,
                full_balance: response ? Math.max(0, parseInt(response.balance)) : 0,
                balance: spendableBalance,
                pending_open_balance: response
                    ? parseInt(response.pending_open_balance)
                    : 0,
            };
        }
    });
}
exports.complexBalances = complexBalances;
function channelBalance(ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('channelBalance', logger_1.logging.Lightning);
        const lightning = yield loadLightning(true, ownerPubkey); // try proxy
        if (isGL(lightning)) {
            return;
        }
        if (isCLN(lightning)) {
            return; // FIXME
        }
        return new Promise((resolve, reject) => {
            lightning.channelBalance({}, function (err, response) {
                if (err == null && response) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        });
    });
}
exports.channelBalance = channelBalance;
/** returns void for greenlight */
function getChanInfo(chan_id, tryProxy) {
    return __awaiter(this, void 0, void 0, function* () {
        // log('getChanInfo')
        const lightning = yield loadLightning(tryProxy === false ? false : true); // try proxy
        if (isGL(lightning)) {
            return; // skip for now
        }
        if (isCLN(lightning)) {
            return; // FIXME
        }
        return new Promise((resolve, reject) => {
            if (!chan_id) {
                return reject('no chan id');
            }
            lightning.getChanInfo({ chan_id }, function (err, response) {
                if (err == null && response) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        });
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
function getInvoiceHandler(payment_hash, ownerPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('getInvoice', logger_1.logging.Lightning);
        const payment_hash_bytes = Buffer.from(payment_hash, 'hex');
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const lightning = yield loadLightning(true, ownerPubkey);
                if (isGL(lightning)) {
                    return; //Fixing this later
                }
                else if (isLND(lightning) || (0, proxy_1.isProxy)(lightning)) {
                    ;
                    lightning.lookupInvoice({ r_hash: payment_hash_bytes }, function (err, response) {
                        if (err) {
                            logger_1.sphinxLogger.error([err], logger_1.logging.Lightning);
                            reject(err);
                        }
                        if (response) {
                            const invoice = {
                                settled: response === null || response === void 0 ? void 0 : response.settled,
                                payment_request: response === null || response === void 0 ? void 0 : response.payment_request,
                                payment_hash: response === null || response === void 0 ? void 0 : response.r_hash.toString('hex'),
                                preimage: (response === null || response === void 0 ? void 0 : response.settled)
                                    ? response === null || response === void 0 ? void 0 : response.r_preimage.toString('hex')
                                    : '',
                                amount: convertMsatToSat(response.amt_paid),
                            };
                            resolve(invoice);
                        }
                    });
                }
                else if (isCLN(lightning)) {
                    yield lightning.listInvoices({
                        payment_hash: payment_hash_bytes,
                    }, (err, response) => {
                        var _a;
                        if (err) {
                            logger_1.sphinxLogger.error([err], logger_1.logging.Lightning);
                            reject(err);
                        }
                        if (response) {
                            if (response.invoices.length > 0) {
                                const res = response.invoices[0];
                                const invoice = {
                                    amount: convertMsatToSat(((_a = res === null || res === void 0 ? void 0 : res.amount_received_msat) === null || _a === void 0 ? void 0 : _a.msat) || 0),
                                    settled: res.status.toLowerCase() === 'paid' ? true : false,
                                    payment_request: res.bolt11,
                                    preimage: res.status.toLowerCase() === 'paid'
                                        ? res.payment_preimage.toString('hex')
                                        : '',
                                    payment_hash: res.payment_hash.toString('hex'),
                                };
                                resolve(invoice);
                            }
                            resolve({});
                        }
                    });
                }
            }
            catch (error) {
                logger_1.sphinxLogger.error([error], logger_1.logging.Lightning);
                throw error;
            }
        }));
    });
}
exports.getInvoiceHandler = getInvoiceHandler;
function convertMsatToSat(amount) {
    return Number(amount) / 1000;
}
function convertToMsat(amount) {
    return Number(amount) * 1000;
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