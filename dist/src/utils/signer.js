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
exports.verifyAscii = exports.signAscii = exports.signBuffer = exports.signMessage = exports.loadSigner = void 0;
const grpc = require("grpc");
const Lightning = require("../grpc/lightning");
const ByteBuffer = require("bytebuffer");
const config_1 = require("./config");
const logger_1 = require("./logger");
// var protoLoader = require('@grpc/proto-loader')
const config = config_1.loadConfig();
const LND_IP = config.lnd_ip || 'localhost';
let signerClient = null;
const loadSigner = () => {
    if (signerClient) {
        return signerClient;
    }
    else {
        try {
            const credentials = Lightning.loadCredentials('signer.macaroon');
            const lnrpcDescriptor = grpc.load('proto/signer.proto');
            const signer = lnrpcDescriptor.signrpc;
            signerClient = new signer.Signer(LND_IP + ':' + config.lnd_port, credentials);
            return signerClient;
        }
        catch (e) {
            //only throw here
            logger_1.sphinxLogger.warning('loadSigner has failed');
            throw e;
        }
    }
};
exports.loadSigner = loadSigner;
const signMessage = (msg) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const signer = yield exports.loadSigner();
        try {
            const options = {
                msg: ByteBuffer.fromHex(msg),
                key_loc: { key_family: 6, key_index: 0 },
            };
            signer.signMessage(options, function (err, sig) {
                if (err || !sig.signature) {
                    reject(err);
                }
                else {
                    const buf = ByteBuffer.wrap(sig.signature);
                    resolve(buf.toBase64());
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
        const signer = yield exports.loadSigner();
        try {
            const options = { msg };
            signer.signMessage(options, function (err, sig) {
                if (err || !sig.signature) {
                    reject(err);
                }
                else {
                    const buf = ByteBuffer.wrap(sig.signature);
                    resolve(buf.toBase64());
                }
            });
        }
        catch (e) {
            reject(e);
        }
    }));
};
exports.signBuffer = signBuffer;
function verifyMessage(msg, sig, pubkey) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const signer = yield exports.loadSigner();
        if (msg.length === 0) {
            return reject('invalid msg');
        }
        if (sig.length !== 96) {
            return reject('invalid sig');
        }
        if (pubkey.length !== 66) {
            return reject('invalid pubkey');
        }
        try {
            const options = {
                msg: ByteBuffer.fromHex(msg),
                signature: ByteBuffer.fromBase64(sig),
                pubkey: ByteBuffer.fromHex(pubkey),
            };
            signer.verifyMessage(options, function (err, res) {
                if (err) {
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
function signAscii(ascii) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sig = yield exports.signMessage(ascii_to_hexa(ascii));
            return sig;
        }
        catch (e) {
            logger_1.sphinxLogger.warning('signAscii has failed');
            throw e;
        }
    });
}
exports.signAscii = signAscii;
function verifyAscii(ascii, sig, pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield verifyMessage(ascii_to_hexa(ascii), sig, pubkey);
            return r;
        }
        catch (e) {
            logger_1.sphinxLogger.warning('verifyAscii has failed');
            throw e;
        }
    });
}
exports.verifyAscii = verifyAscii;
function ascii_to_hexa(str) {
    const arr1 = [];
    for (let n = 0, l = str.length; n < l; n++) {
        const hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}
//# sourceMappingURL=signer.js.map