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
exports.getAllMessages = void 0;
const helpers_1 = require("../helpers");
const http = require("ava-http");
function getAllMessages(node) {
    return __awaiter(this, void 0, void 0, function* () {
        const msg = yield http.get(node.external_ip + '/allmessages', helpers_1.makeArgs(node));
        return msg.response.new_messages;
    });
}
exports.getAllMessages = getAllMessages;
//# sourceMappingURL=getAllMessages.js.map