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
exports.tryToUnlockLND = void 0;
const lightning_1 = require("./lightning");
const config_1 = require("./config");
const fs = require('fs');
const readline = require('readline');
const config = config_1.loadConfig();
/*
"lnd_pwd_path": "/relay/.lnd/.lndpwd"
*/
function tryToUnlockLND() {
    return __awaiter(this, void 0, void 0, function* () {
        const p = config.lnd_pwd_path;
        if (!p)
            return;
        console.log('==>', p);
        var pwd = yield getFirstLine(config.lnd_pwd_path);
        if (!pwd)
            return;
        console.log('==>', pwd, typeof pwd);
        try {
            yield lightning_1.unlockWallet(String(pwd));
        }
        catch (e) {
            console.log('[unlock] Error:', e);
        }
    });
}
exports.tryToUnlockLND = tryToUnlockLND;
function getFirstLine(pathToFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const readable = fs.createReadStream(pathToFile);
        const reader = readline.createInterface({ input: readable });
        const line = yield new Promise((resolve) => {
            reader.on('line', (line) => {
                reader.close();
                resolve(line);
            });
        });
        readable.close();
        return line;
    });
}
//# sourceMappingURL=unlock.js.map