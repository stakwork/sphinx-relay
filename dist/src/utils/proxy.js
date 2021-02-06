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
exports.loadProxyLightning = exports.isProxy = exports.loadProxyCredentials = void 0;
const fs = require("fs");
const grpc = require("grpc");
const config_1 = require("./config");
const lightning_1 = require("./lightning");
// var protoLoader = require('@grpc/proto-loader')
const config = config_1.loadConfig();
const LND_IP = config.lnd_ip || 'localhost';
const PROXY_LND_IP = config.proxy_lnd_ip || 'localhost';
function loadProxyCredentials(macPrefix) {
    var lndCert = fs.readFileSync(config.proxy_tls_location);
    var sslCreds = grpc.credentials.createSsl(lndCert);
    const m = fs.readFileSync(config.proxy_macaroons_dir + '/' + macPrefix + '.macaroon');
    const macaroon = m.toString('hex');
    var metadata = new grpc.Metadata();
    metadata.add('macaroon', macaroon);
    var macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
        callback(null, metadata);
    });
    return grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
}
exports.loadProxyCredentials = loadProxyCredentials;
function isProxy() {
    return (config.proxy_lnd_port && config.proxy_macaroons_dir && config.proxy_tls_location) ? true : false;
}
exports.isProxy = isProxy;
// var proxyLightningClient = <any>null;
function loadProxyLightning(childPubKey) {
    return __awaiter(this, void 0, void 0, function* () {
        // if (proxyLightningClient) {
        //   return proxyLightningClient
        // }
        try {
            let macname;
            if (childPubKey && childPubKey.length === 66) {
                macname = childPubKey;
            }
            else {
                macname = yield getProxyRootPubkey();
            }
            var credentials = loadProxyCredentials(macname);
            var lnrpcDescriptor = grpc.load("proto/rpc_proxy.proto");
            var lnrpc = lnrpcDescriptor.lnrpc_proxy;
            const the = new lnrpc.Lightning(PROXY_LND_IP + ':' + config.proxy_lnd_port, credentials);
            return the;
        }
        catch (e) {
            console.log("ERROR in loadProxyLightning", e);
        }
    });
}
exports.loadProxyLightning = loadProxyLightning;
var proxyRootPubkey = '';
function getProxyRootPubkey() {
    return new Promise((resolve, reject) => {
        if (proxyRootPubkey) {
            resolve(proxyRootPubkey);
            return;
        }
        // normal client, to get pubkey of LND
        var credentials = lightning_1.loadCredentials();
        var lnrpcDescriptor = grpc.load("proto/rpc.proto");
        var lnrpc = lnrpcDescriptor.lnrpc;
        var lc = new lnrpc.Lightning(LND_IP + ':' + config.lnd_port, credentials);
        lc.getInfo({}, function (err, response) {
            if (err == null) {
                proxyRootPubkey = response.identity_pubkey;
                resolve(proxyRootPubkey);
            }
            else {
                reject("CANT GET ROOT KEY");
            }
        });
    });
}
//# sourceMappingURL=proxy.js.map