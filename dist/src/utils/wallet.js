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
const config_1 = require("./config");
const config = config_1.loadConfig();
const LND_IP = config.lnd_ip || 'localhost';
let walletClient;
exports.loadWalletKit = () => {
    if (walletClient) {
        return walletClient;
    }
    else {
        try {
            var credentials = lightning_1.loadCredentials();
            var lnrpcDescriptor = grpc.load("proto/walletkit.proto");
            var walletkit = lnrpcDescriptor.walletrpc;
            walletClient = new walletkit.WalletKit(LND_IP + ':' + config.lnd_port, credentials);
            return walletClient;
        }
        catch (e) {
            throw e;
        }
    }
};
exports.listUnspent = () => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let walletkit = yield exports.loadWalletKit();
        try {
            const opts = { min_confs: 1, max_confs: 100 };
            walletkit.listUnspent(opts, function (err, res) {
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
};
//# sourceMappingURL=wallet.js.map