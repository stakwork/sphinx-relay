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
exports.getCheckTribe = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
function getCheckTribe(_t, node, tribeId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            timeout(0, node, tribeId, resolve, reject);
        }), 1000);
    });
}
exports.getCheckTribe = getCheckTribe;
function timeout(i, node, tribeId, resolve, reject) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield http.get(node.external_ip + '/contacts', helpers_1.makeArgs(node));
        if (res) {
            let r = res.response.chats.find((chat) => chat.id === tribeId);
            if (r) {
                return resolve(r);
            }
        }
        if (i > 10) {
            return reject(['failed to getCheckTribe']);
        }
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            timeout(i + 1, node, tribeId, resolve, reject);
        }), 1000);
    });
}
//# sourceMappingURL=getCheckTribe.js.map