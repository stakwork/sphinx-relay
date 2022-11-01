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
exports.listUnspent = exports.loadWalletKit = void 0;
const grpc = require("grpc");
const Lightning = require("../grpc/lightning");
const config_1 = require("./config");
const logger_1 = require("./logger");
const config = (0, config_1.loadConfig)();
const LND_IP = config.lnd_ip || 'localhost';
let walletClient;
const loadWalletKit = () => {
    if (walletClient) {
        return walletClient;
    }
    else {
        try {
            const credentials = Lightning.loadCredentials();
            const lnrpcDescriptor = grpc.load('proto/walletkit.proto');
            const walletkit = lnrpcDescriptor.walletrpc;
            walletClient = new walletkit.WalletKit(LND_IP + ':' + config.lnd_port, credentials);
            return walletClient;
        }
        catch (e) {
            logger_1.sphinxLogger.warning(`unable to loadWalletKit`);
            throw e;
        }
    }
};
exports.loadWalletKit = loadWalletKit;
function listUnspent() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const walletkit = yield (0, exports.loadWalletKit)();
            try {
                const opts = { min_confs: 0, max_confs: 10000 };
                walletkit.listUnspent(opts, function (err, res) {
                    if (err || !(res && res.utxos)) {
                        reject(err);
                    }
                    else {
                        resolve(res.utxos);
                    }
                });
            }
            catch (e) {
                reject(e);
            }
        }));
    });
}
exports.listUnspent = listUnspent;
//# sourceMappingURL=wallet.js.map