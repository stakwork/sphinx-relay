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
exports.getCheckNewMsgs = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
function getCheckNewMsgs(_t, node, msgUuid) {
    return new Promise((resolve, reject) => {
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            timeout(0, node, msgUuid, resolve, reject);
        }), 1000);
    });
}
exports.getCheckNewMsgs = getCheckNewMsgs;
function timeout(i, node, msgUuid, resolve, reject) {
    return __awaiter(this, void 0, void 0, function* () {
        const msgRes = yield http.get(node.external_ip + '/messages', (0, helpers_1.makeArgs)(node));
        if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
            // console.log('===>', msgRes.response.new_messages, msgUuid)
            const lastMessage = msgRes.response.new_messages.find((msg) => msg.uuid === msgUuid);
            if (lastMessage) {
                return resolve(lastMessage);
            }
        }
        if (i > 10) {
            return reject('failed to getCheckNewMsgs');
        }
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            timeout(i + 1, node, msgUuid, resolve, reject);
        }), 1000);
    });
}
//# sourceMappingURL=getCheckNewMessages.js.map