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
const res_1 = require("../utils/res");
const path = require("path");
const fs = require("fs");
const network = require("../network");
const actionFile = '../../../actions.json';
function doAction(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const thePath = path.join(__dirname, actionFile);
        try {
            if (fs.existsSync(thePath)) {
                processExtra(req, res);
            }
            else {
                res_1.failure(res, 'no file');
            }
        }
        catch (err) {
            console.error(err);
            res_1.failure(res, 'fail');
        }
    });
}
exports.doAction = doAction;
function processExtra(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const actions = require(path.join(__dirname, actionFile));
        if (!(actions && actions.length)) {
            return res_1.failure(res, 'no actions defined');
        }
        const { action, app, secret, pubkey, amount } = req.body;
        const theApp = actions.find(a => a.app === app);
        if (!theApp) {
            return res_1.failure(res, 'app not found');
        }
        if (!(theApp.secret && theApp.secret === secret)) {
            return res_1.failure(res, 'wrong secret');
        }
        if (!(pubkey && pubkey.length === 66 && amount && action)) {
            return res_1.failure(res, 'wrong params');
        }
        if (action === 'keysend') {
            const MIN_SATS = 3;
            const destkey = pubkey;
            const opts = {
                dest: destkey,
                data: {},
                amt: Math.max((amount || 0), MIN_SATS)
            };
            try {
                yield network.signAndSend(opts);
                return res_1.success(res, { success: true });
            }
            catch (e) {
                return res_1.failure(res, e);
            }
        }
        else {
            return res_1.failure(res, 'no action');
        }
    });
}
//# sourceMappingURL=actions.js.map