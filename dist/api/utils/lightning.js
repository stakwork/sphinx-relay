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
const ByteBuffer = require("bytebuffer");
const fs = require("fs");
const grpc = require("grpc");
const helpers_1 = require("../helpers");
const sha = require("js-sha256");
const crypto = require("crypto");
const path = require("path");
// var protoLoader = require('@grpc/proto-loader')
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../../config/app.json'))[env];
const LND_KEYSEND_KEY = 5482373484;
exports.LND_KEYSEND_KEY = LND_KEYSEND_KEY;
const SPHINX_CUSTOM_RECORD_KEY = 133773310;
exports.SPHINX_CUSTOM_RECORD_KEY = SPHINX_CUSTOM_RECORD_KEY;
var lightningClient = null;
var walletUnlocker = null;
const loadCredentials = () => {
    var lndCert = fs.readFileSync(config.tls_location);
    var sslCreds = grpc.credentials.createSsl(lndCert);
    var m = fs.readFileSync(config.macaroon_location);
    var macaroon = m.toString('hex');
    var metadata = new grpc.Metadata();
    metadata.add('macaroon', macaroon);
    var macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
        callback(null, metadata);
    });
    return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
};
exports.loadCredentials = loadCredentials;
// async function loadLightningNew() {
//   if (lightningClient) {
//     return lightningClient
//   } else {
//   	var credentials = loadCredentials()
//     const packageDefinition = await protoLoader.load("rpc.proto", {})
//     const lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
//     var { lnrpc } = lnrpcDescriptor;
//     lightningClient = new lnrpc.Lightning(config.node_ip + ':' + config.lnd_port, credentials);
//     return lightningClient
//   }
// }
const loadLightning = () => {
    if (lightningClient) {
        return lightningClient;
    }
    else {
        try {
            var credentials = loadCredentials();
            var lnrpcDescriptor = grpc.load("rpc.proto");
            var lnrpc = lnrpcDescriptor.lnrpc;
            lightningClient = new lnrpc.Lightning(config.node_ip + ':' + config.lnd_port, credentials);
            return lightningClient;
        }
        catch (e) {
            throw e;
        }
    }
};
exports.loadLightning = loadLightning;
const loadWalletUnlocker = () => {
    if (walletUnlocker) {
        return walletUnlocker;
    }
    else {
        var credentials = loadCredentials();
        try {
            var lnrpcDescriptor = grpc.load("rpc.proto");
            var lnrpc = lnrpcDescriptor.lnrpc;
            walletUnlocker = new lnrpc.WalletUnlocker(config.node_ip + ':' + config.lnd_port, credentials);
            return walletUnlocker;
        }
        catch (e) {
            console.log(e);
        }
    }
};
exports.loadWalletUnlocker = loadWalletUnlocker;
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
const getRoute = (pub_key, amt, callback) => __awaiter(void 0, void 0, void 0, function* () {
    let lightning = yield loadLightning();
    lightning.queryRoutes({ pub_key, amt }, (err, response) => callback(err, response));
});
exports.getRoute = getRoute;
const keysend = (opts) => {
    return new Promise(function (resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            let lightning = yield loadLightning();
            console.log("FIRST OPTS", opts);
            const randoStr = crypto.randomBytes(32).toString('hex');
            const preimage = ByteBuffer.fromHex(randoStr);
            const options = {
                amt: Math.max(opts.amt, 3),
                final_cltv_delta: 10,
                dest: ByteBuffer.fromHex(opts.dest),
                dest_custom_records: {
                    [`${LND_KEYSEND_KEY}`]: preimage,
                    [`${SPHINX_CUSTOM_RECORD_KEY}`]: ByteBuffer.fromUTF8(opts.data),
                },
                payment_hash: sha.sha256.arrayBuffer(preimage.toBuffer()),
                dest_features: [9],
            };
            console.log("FINAL OPTIONS", options);
            const call = lightning.sendPayment();
            call.on('data', function (payment) {
                if (payment.payment_error) {
                    reject(payment.payment_error);
                }
                else {
                    resolve(payment);
                }
            });
            call.on('error', function (err) {
                reject(err);
            });
            call.write(options);
        });
    });
};
const MAX_MSG_LENGTH = 972; // 1146 - 20 ???
function keysendMessage(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!opts.data || typeof opts.data !== 'string') {
                    return reject('string plz');
                }
                if (opts.data.length < MAX_MSG_LENGTH) {
                    try {
                        const res = yield keysend(opts);
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
                    try {
                        res = yield keysend(Object.assign(Object.assign({}, opts), { data: `${ts}_${i}_${n}_${m}` }));
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
function signAscii(ascii) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sig = yield signMessage(ascii_to_hexa(ascii));
            return sig;
        }
        catch (e) {
            throw e;
        }
    });
}
exports.signAscii = signAscii;
function listInvoices() {
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
const signMessage = (msg) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let lightning = yield loadLightning();
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
const signBuffer = (msg) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let lightning = yield loadLightning();
        try {
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
function verifyMessage(msg, sig) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        let lightning = yield loadLightning();
        try {
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
function verifyAscii(ascii, sig) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield verifyMessage(ascii_to_hexa(ascii), sig);
            return r;
        }
        catch (e) {
            throw e;
        }
    });
}
exports.verifyAscii = verifyAscii;
function getInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const lightning = loadLightning();
            lightning.getInfo({}, function (err, response) {
                if (err == null) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        });
    });
}
exports.getInfo = getInfo;
function ascii_to_hexa(str) {
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n++) {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}
//# sourceMappingURL=lightning.js.map