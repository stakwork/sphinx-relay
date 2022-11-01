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
exports.getCheckAllMessages = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
function getCheckAllMessages(_t, node, limit, offset, order = 'asc') {
    return new Promise((resolve, reject) => {
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            timeout(0, node, limit, offset, order, resolve, reject);
        }), 1000);
    });
}
exports.getCheckAllMessages = getCheckAllMessages;
function timeout(i, node, limit, offset, order, resolve, reject) {
    return __awaiter(this, void 0, void 0, function* () {
        const msgRes = yield http.get(`${node.external_ip}/allmessages?limit=${limit}&offset=${offset}&order=${order}`, helpers_1.makeArgs(node));
        if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
            // console.log('===>', msgRes.response.new_messages )
            return resolve(msgRes.response);
        }
        if (i > 10) {
            return reject('failed to getCheckMsgs');
        }
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            timeout(i + 1, node, limit, offset, order, resolve, reject);
        }), 1000);
    });
}
//# sourceMappingURL=getCheckAllMessages.js.map