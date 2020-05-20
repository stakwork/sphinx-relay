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
const grpc = require("grpc");
const lightning_1 = require("./lightning");
const path = require("path");
const ByteBuffer = require("bytebuffer");
// var protoLoader = require('@grpc/proto-loader')
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../../config/app.json'))[env];
var signerClient = null;
exports.loadSigner = () => {
    console.log("LOAD SIGNER RRRRRR", signerClient ? true : false);
    if (signerClient) {
        return signerClient;
    }
    else {
        console.log("LOAD SIGNER AGAIN!!!!");
        try {
            var credentials = lightning_1.loadCredentials();
            var lnrpcDescriptor = grpc.load("signer.proto");
            var signer = lnrpcDescriptor.signrpc;
            signerClient = new signer.Signer(config.node_ip + ':' + config.lnd_port, credentials);
            console.log("SIGNER CLIENT", signerClient);
            return signerClient;
        }
        catch (e) {
            throw e;
        }
    }
};
exports.signMessage = (msg) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let signer = yield exports.loadSigner();
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
                    resolve(sig.signature);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    }));
};
exports.signBuffer = (msg) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let signer = yield exports.loadSigner();
        try {
            const options = { msg };
            signer.signMessage(options, function (err, sig) {
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
function verifyMessage(msg, sig) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        let signer = yield exports.loadSigner();
        try {
            const options = {
                msg: ByteBuffer.fromHex(msg),
                signature: sig,
            };
            signer.verifyMessage(options, function (err, res) {
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
function signAscii(ascii) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sig = yield exports.signMessage(ascii_to_hexa(ascii));
            return sig;
        }
        catch (e) {
            throw e;
        }
    });
}
exports.signAscii = signAscii;
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
function ascii_to_hexa(str) {
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n++) {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}
//# sourceMappingURL=signer.js.map